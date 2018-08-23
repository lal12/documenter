
import { Meta, Tag, Document, File, fileTypes, MetaData } from "../entities";
import * as Util from "util";
import * as Path from "path";
import * as FS from "fs";
import * as Multer from "multer";
import {Express} from "express";
import { IsNull } from "typeorm";


export default function init(app: Express, filePath: string, upload: Multer.Instance){
    app.get("/api/files/:uuid", async (req,res)=>{
		let file = await File.findOne({uuid: req.params.uuid});
		if(!file){
			res.status(404).end();
		}else{
			res.download(Path.join(filePath, file.filename), file.origFilename)
		}
    })
	
	app.delete("/api/files/:uuid", async (req,res)=>{
		let file = await File.findOne({uuid: req.params.uuid});
		if(!file){
			res.status(404).end();
		}else{
			try{
				await Util.promisify(FS.unlink)(Path.join(filePath, file.filename));
			}catch(e){
				console.warn("File could not be deleted: ",e,file)
			}
			await file.remove();
			res.end();
		}
    })

    app.post("/api/inbox", upload.array("files", 20), async (req, res)=>{
		let files = (req.files as any)as Express.Multer.File[];
		for(let i in files){
			let f = files[i];
			let ext = Path.extname(f.originalname).substr(1).toLowerCase();
			if(fileTypes.indexOf(ext)==-1){
				res.status(422).send("Invalid file extension only supporting: "+fileTypes.join(","));
				return;
			}
		}
		let promises = files.map(f=>{
			let dbFile = new File();
			dbFile.origFilename = f.originalname;
			dbFile.filetype = Path.extname(f.originalname).substr(1).toLowerCase() as any;
			return dbFile.save().then(async dbFile=>{
				await Util.promisify(FS.rename)(f.path, Path.join(filePath, dbFile.filename));
                return dbFile;
            })
		});
		let dbFiles = await Promise.all(promises);
		res.json(dbFiles.map(f=>f.uuid)).end()
	})

	app.get("/api/inbox", async (req, res)=>{
		let files = await File.find({documentUUID: IsNull() as any})
		console.log(files)
		res.json(files.map(f=>f.toObj())).end()
	})
}