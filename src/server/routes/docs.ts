import * as JOI from "joi";
import * as Path from "path";
import * as FS from "fs-extra";
import * as Multer from "multer";
import { textFromFile, keywordsFromText, insertNonExistingKeywords } from "../keywords";
import { Server } from "../server";
import { move, runOCR } from "../utils";
import { Document } from "../entities/document";
import { Meta } from "../entities/meta";
import { MetaData } from "../entities/metadata";
import { Tag } from "../entities/tag";
import { fileTypes, File } from "../entities/file";
import { DateTime } from "luxon";

export default function init(server: Server){
	const app = server.app;
    // Document methods
	/* replaced by graphql
	app.get("/api/docs/:uuid", async (req, res)=>{
		let doc = await Document.findOne({uuid: req.params.uuid});
		if(!doc){
			res.status(404).end()
		}else{
			res.json(await doc.toObj()).end();
		}
	})*/
	app.put("/api/docs/:uuid", server.jsonParser, async (req, res)=>{
		let metas = await Meta.find();
		let doc = await Document.findOne({uuid: req.params.uuid}, {loadEagerRelations: true});
		if(!doc){
			res.status(404).end()
			return;
		}
		if(req.header("Content-Type") != "application/json" || !req.body){
			res.status(422).send("Expecting json body!");
			return;
		}
		let allowedMetaData : {[k:string]:JOI.Schema} = {};
		metas.forEach(m=>{
			switch(m.type){
				case 'date':
					allowedMetaData[m.id] = JOI.date().timestamp();
				break;
				case 'datetime':
					allowedMetaData[m.id] = JOI.date().timestamp();
				break;
				case 'decimal':
					allowedMetaData[m.id] = JOI.number();
				break;
				case 'int':
					allowedMetaData[m.id] = JOI.number().integer();
				break;
				case 'string':
					allowedMetaData[m.id] = JOI.string();
				break;
				case 'uint':
					allowedMetaData[m.id] = JOI.number().integer().min(0);
				break;
			}
			if(m.isArray)
				allowedMetaData[m.id] = JOI.array().items(allowedMetaData[m.id]);
			if(!m.required)
				allowedMetaData[m.id] = allowedMetaData[m.id].optional();
			
		})
		let {value, error} = JOI.object({
			title: JOI.string().min(1).optional(),
			documentDate: JOI.date().timestamp().optional(),
			tags: JOI.array().items(JOI.string()).optional(),
			metadata: allowedMetaData
		}).validate(req.body);
		if(error){
			res.status(422).send(error.message);
			return;
		}
		if(value.metadata){
			doc.metadata = Promise.resolve([]);
			await doc.save();
			let promises : Promise<any>[] = [];
			for(let m of metas){
				let val = value.metadata[m.id];
				if(val){
					if(m.isArray){
						(val as string[]).forEach((v,i)=>{
							let md = new MetaData();
							md.document = doc!;
							if(m.isArray != Array.isArray(val)){
								res.status(422).send("attr has invalid type: "+m.id);
								return;
							}					md.meta = m;
							md.data = v;
							md.index = i;
							promises.push(md.save());
						})
					}else{
						let md = new MetaData();
						md.document = doc;
						md.meta = m;
						md.data = val;
						promises.push(md.save());
					}
				}else if(m.required){
					let md = new MetaData();
					md.document = doc;
					md.meta = m;
					if(m.isArray){
						md.index = 0;
					}
					promises.push(md.save());
				}
			}
			await promises;
		}
		if(value.title){
			doc.title = value.title;
		}
		if(value.tags){
			doc.tags = [];
			for(let tid of value.tags){
				let tag = await Tag.findOne({id: tid});
				if(!tag){
					res.status(422).send("Unknown Tag: "+tid);
					return;
				}
				doc.tags.push(tag);
			}
		}
		if(value.documentDate){ // joi converts to js date
			doc.documentDate = DateTime.fromJSDate(value.documentDate);
		}
		try{
			await doc.save();
		}catch(e){
			debugger;
		}
		res.end();
	})
	async function postProcessFile(f: File){
		const filepath = Path.join(server.filesPath, f.filename);
		try{
			let text;
			if(!f.isTextFile){
				let ocrFilePath = Path.join(server.filesPath, Path.basename(f.filename, f.filetype)+"ocr");
				await runOCR(filepath, ocrFilePath);
				ocrFilePath += ".pdf"; // .pdf is automatically appended by tesseract!
				let ocrOrigFilename = Path.basename(f.origFilename, f.filetype)+".ocr.pdf";
				try{
					text = await textFromFile(ocrFilePath, ocrOrigFilename);
				}catch(e){ // ocr file is useless
					await FS.unlink(ocrFilePath);
					throw e;
				}
			}else{
				text = await textFromFile(filepath, f.origFilename);
			}
			let kw = keywordsFromText(text);
			f.keywords = Promise.resolve(await insertNonExistingKeywords(kw));
			return true;
		}catch(e){
			console.error('failed to postprocess file: ', e);
			return false;
		}
	}
	app.post("/api/docs/upload", server.upload.array("files", 20), async (req, res)=>{
		let files = (req.files as any)as Express.Multer.File[];
		for(let i in files){
			let f = files[i];
			let ext = Path.extname(f.originalname).substr(1).toLowerCase();
			if(fileTypes.indexOf(ext)==-1){
				res.status(422).send("Invalid file extension only supporting: "+fileTypes.join(","));
				return;
			}
		}
		let doc = await Document.newDoc(files[0].originalname);
		await doc.save();
		try{
			let promises = files.map(async f=>{
				let dbFile = new File();
				dbFile.document = doc;
				dbFile.origFilename = f.originalname;
				dbFile.filetype = Path.extname(f.originalname).substr(1).toLowerCase() as any;
				await dbFile.save(); // Save first time to retrieve uuid
				const filepath = Path.join(server.filesPath, dbFile.filename);
				await move(f.path, filepath);
				await postProcessFile(dbFile);
				dbFile.createThumbnail(server.filesPath, server.thumbnailPath);
				await dbFile.save();
			});
			let kws = await Promise.all(promises);
			res.json({uuid: doc.uuid}).end()
		}catch(e){
			console.error('Failed to create document', e)
			await doc.remove();
			res.status(500);
		}
	})
	app.post("/api/docs/inbox", server.jsonParser, async (req, res)=>{
		let fileUUIDs = req.body;
		if(!fileUUIDs || !Array.isArray(fileUUIDs)){
			res.status(422).send("Invalid post paramaters!");
			return;
		}
		let files = [];
		for(let uuid of fileUUIDs){
			let f = await File.findOne({uuid});
			if(!f){
				res.status(422).send("No file with uuid: "+uuid);
				return;
			}
			files.push(f);
		}
		let doc = await Document.newDoc();
		await Promise.all(files.map(async f=>{
			f.document = doc;
			await postProcessFile(f);
			await f.save();
		}))
		res.json(await doc.toObj()).end()
	})
	app.delete("/api/docs/:uuid", async (req,res)=>{
		let doc = await Document.findOne({uuid: req.params.uuid});
		if(!doc){
			res.status(404).end();
		}else{
			await doc.remove(); // files in db and on fs should be deleted here automatically
			res.end();
		}
	})
	app.get("/api/docs/:uuid/files/zip", async (req,res)=>{
		let doc = await Document.findOne({uuid: req.params.uuid});
		if(!doc){
			res.status(404).end();
		}else{
			let files = await doc.files;
			(res as any).zip({
				files: files.map(f=>({
					path: Path.join(server.filesPath, f.filename),
					name: f.origFilename
				})),
				filename: doc.title+".zip"
			});
		}
	})
	/* replaced by graphql
	app.get("/api/docs/:uuid/files", async (req,res)=>{
		let doc = await Document.findOne({uuid: req.params.uuid});
		if(!doc){
			res.status(404).end();
		}else{
			let files = await doc.files;
			res.json(files.map(f=>({
				uuid: f.uuid,
				origFilename: f.origFilename,
				filetype: f.filetype
			}))).end();
		}
	})
	*/
}