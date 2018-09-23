
import * as Util from "util";
import * as Path from "path";
import * as FS from "fs";
import * as Multer from "multer";
import {Express} from "express";
import { IsNull } from "typeorm";
import { Server } from "../server";
import { move } from "../utils";
import { File, fileTypes } from "../entities/file";

export default function init(server: Server){
    server.app.get("/api/files/:uuid", async (req,res)=>{
		let file = await File.findOne({uuid: req.params.uuid});
		if(!file){
			res.status(404).end();
		}else{
			res.download(Path.join(server.filesPath, file.filename), file.origFilename)
		}
	})
	server.app.get("/api/files/:uuid/ocr", async (req,res)=>{
		let file = await File.findOne({uuid: req.params.uuid});
		if(!file || file.isTextFile == false){
			res.status(404).end();
		}else{
			let ocrpath = Path.join(server.filesPath, file.uuid+".ocr.pdf");
			let dlFilename = Path.basename(file.origFilename, file.filetype)+".ocr.pdf";
			res.download(ocrpath, dlFilename);
		}
	})
	server.app.get("/api/files/:uuid/thumbnail", async (req,res)=>{
		let file = await File.findOne({uuid: req.params.uuid});
		if(!file){
			res.status(404).end();
		}else{
			res.sendFile(Path.join(server.thumbnailPath, file.uuid+".jpg"), file.origFilename)
		}
    })
	
	server.app.delete("/api/files/:uuid", async (req,res)=>{
		let file = await File.findOne({uuid: req.params.uuid});
		if(!file){
			res.status(404).end();
		}else{
			try{
				await Util.promisify(FS.unlink)(Path.join(server.filesPath, file.filename));
			}catch(e){
				console.warn("File could not be deleted: ",e,file)
			}
			await file.remove();
			res.end();
		}
    })

    server.app.post("/api/inbox", server.upload.array("files", 20), async (req, res)=>{
		let files = (req.files as any)as Express.Multer.File[];
		for(let i in files){
			let f = files[i];
			let ext = Path.extname(f.originalname).substr(1).toLowerCase();
			if(fileTypes.indexOf(ext)==-1){
				res.status(422).send("Invalid file extension only supporting: "+fileTypes.join(","));
				return;
			}
		}
		let promises = files.map(async f=>{
			let dbFile = new File();
			dbFile.origFilename = f.originalname;
			dbFile.filetype = Path.extname(f.originalname).substr(1).toLowerCase() as any;
			dbFile = await dbFile.save();
			await move(f.path, Path.join(server.filesPath, dbFile.filename));
			dbFile.createThumbnail(server.filesPath, server.thumbnailPath);
			return dbFile;
		});
		let dbFiles = await Promise.all(promises);
		res.json(dbFiles.map(f=>f.uuid)).end()
	})

	server.app.get("/api/inbox", async (req, res)=>{
		let files = await File.find({documentUUID: IsNull() as any})
		res.json(files.map(f=>f.toObj())).end()
	})
}