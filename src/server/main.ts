import * as express from "express";
import * as Path from "path";
import * as FS from "fs";
import {createConnection, TableForeignKey} from "typeorm";
import * as Util from "util";
import { Tag, Document, Meta, MetaData, fileTypes, File } from "./entities";
import * as JOI from "joi";
import * as bodyParser from "body-parser";
import * as Multer from "multer";
import * as ZIP from "express-easy-zip";

import initTagRoutes from "./routes/tags";
import initMetaRoutes from "./routes/meta";
import initUiRoutes from "./routes/ui";
import initDocRoutes from "./routes/docs";
import initFileRoutes from "./routes/files";

const CONFIG = require(Path.join(__dirname,"..","..","config.json"));


const dataPath = Path.join(__dirname, "..", "..");
const uploadPath = Path.join(dataPath, "uploads");
const filePath = Path.join(dataPath, "files");

const assetsPath = Path.join(__dirname, "..", "..", "dist", "public");
const jsonParser = bodyParser.json();
const upload = Multer({dest: uploadPath})

async function init(){
	try{
		await Util.promisify(FS.mkdir)(filePath);
	}catch(e){}
	try{
		await Util.promisify(FS.mkdir)(uploadPath);
	}catch(e){}
	const db = await createConnection({
		type: "mysql", 
		database: CONFIG.mysql.database,
		username: CONFIG.mysql.user,
		password: CONFIG.mysql.password,
		synchronize: true,
		entities: [Tag, Document, Meta, MetaData, File],
	});

	// Initialize db
	let metas = [
		{id: "received", title: "Empfangen", 
		deleteable: false, isArray: false,
		optional: true, type: "date"}
	];
	try{
		Promise.all(metas.map(m=>{
			let add = new Meta();
			for(let p in m)
				(add as any)[p] = (m as any)[p];
			return add.save();
		}));
	}catch(e){}


	const app = express();
	await new Promise((res,rej)=>app.listen(3000, ()=>res()));

	app.use(ZIP());

	initTagRoutes(app, jsonParser);
	initMetaRoutes(app, jsonParser)
	initUiRoutes(app, assetsPath);
	initDocRoutes(app, jsonParser, filePath, upload)
	initFileRoutes(app, filePath, upload);
	

	
	app.get('/api/dates', async (req, res)=>{
		//TODO
	});

	
}

init();