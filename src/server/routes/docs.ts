import {Express} from "express";
import { NextHandleFunction } from "connect";
import * as JOI from "joi";
import { Meta, Tag, Document, File, fileTypes, MetaData } from "../entities";
import * as Util from "util";
import * as Path from "path";
import * as FS from "fs";
import * as Multer from "multer";
import { textFromFile, keywordsFromText, insertNonExistingKeywords } from "../keywords";

export default function init(app: Express, jsonParser: NextHandleFunction, filePath: string, upload: Multer.Instance){
    // Document methods
	app.get("/api/docs", async (req, res)=>{
		let docs = await Document.find();
		res.json(await Promise.all(docs.map(d=>d.toObj()))).end()
	})
	app.get("/api/docs/:uuid", async (req, res)=>{
		let doc = await Document.findOne({uuid: req.params.uuid});
		if(!doc){
			res.status(404).end()
		}else{
			res.json(await doc.toObj()).end();
		}
	})
	app.put("/api/docs/:uuid", jsonParser, async (req, res)=>{
		let doc = await Document.findOne({uuid: req.params.uuid});
		if(!doc){
			res.status(404).end()
			return;
		}
		if(req.header("Content-Type") != "application/json" || !req.body){
			res.status(422).send("Expecting json body!");
			return;
		}
		let {value, error} = JOI.object({
			title: JOI.string().min(1).required(),
			documentDate: JOI.date().iso().required(),
			tags: JOI.array().items(JOI.string()).required(),
		}).validate(req.body);
		if(error){
			res.status(422).send(error.message);
			return;
		}
		for(let tid of value.tags){
			let tag = await Tag.findOne({id: tid});
			if(!tag){
				res.status(422).send("Unknown Tag: "+tid);
				return;
			}
			doc.tags.push(tag);
		}
		value.documentDate = new Date(value.documentDate);
		doc.documentDate = value.documentDate;
		await doc.save();
		res.end();
	})
	app.post("/api/docs/upload", upload.array("files", 20), async (req, res)=>{
		let files = (req.files as any)as Express.Multer.File[];
		for(let i in files){
			let f = files[i];
			let ext = Path.extname(f.originalname).substr(1).toLowerCase();
			if(fileTypes.indexOf(ext)==-1){
				res.status(422).send("Invalid file extension only supporting: "+fileTypes.join(","));
				return;
			}
		}
		let doc = await Document.newDoc();
		let promises = files.map(async f=>{
			let dbFile = new File();
			dbFile.document = doc;
			dbFile.origFilename = f.originalname;
			dbFile.filetype = Path.extname(f.originalname).substr(1).toLowerCase() as any;
			await dbFile.save()
			await Util.promisify(FS.rename)(f.path, Path.join(filePath, dbFile.filename));
			let text = await textFromFile(Path.join(filePath, dbFile.filename), dbFile.origFilename);
			let kw = keywordsFromText(text);
			dbFile.keywords = await insertNonExistingKeywords(kw);
			await dbFile.save();
		});
		let kws = await Promise.all(promises);
		res.json(await doc.toObj()).end()
	})
	app.post("/api/docs/inbox", jsonParser, async (req, res)=>{
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
		await Promise.all(files.map(f=>{
			f.document = doc;
			return f.save();
		}))
		res.json(await doc.toObj()).end()
	})
	app.delete("/api/docs/:uuid", async (req,res)=>{
		let doc = await Document.findOne({uuid: req.params.uuid});
		if(!doc){
			res.status(404).end();
		}else{
			let files = await doc.files;
			files.forEach(f=>Util.promisify(FS.unlink)(Path.join(filePath, f.filename)))
			await Promise.all(files.map(f=>f.remove()));
			await doc.remove();
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
					path: Path.join(filePath, f.filename),
					name: f.origFilename
				})),
				filename: doc.title+".zip"
			});
		}
	})
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
}