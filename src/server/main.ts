import * as express from "express";
import * as Path from "path";
import * as FS from "fs";
import {createConnection, TableForeignKey} from "typeorm";
import * as Util from "util";
import { Tag, Document, Meta, MetaData, File, Keyword} from "./entities";
import * as JOI from "joi";
import * as bodyParser from "body-parser";
import * as Multer from "multer";
import * as ZIP from "express-easy-zip";

import initTagRoutes from "./routes/tags";
import initMetaRoutes from "./routes/meta";
import initUiRoutes from "./routes/ui";
import initDocRoutes from "./routes/docs";
import initFileRoutes from "./routes/files";

const {value, error} = JOI.object({
	mysql: JOI.object({
		host: JOI.string().min(1).required(),
		user: JOI.string().min(1).required(),
		password: JOI.string().min(1).required(),
		database: JOI.string().min(1).required(),
	}).required(),
	paths: JOI.object({
		files: JOI.string().min(1).required(),
        thumbnails: JOI.string().min(1).required(),
    	tmp: JOI.string().min(1).required()
	}).required()
}).validate(require(Path.join(process.cwd(),"config.json")));

if(error){
	console.error("Invalid config: ", error.message);
	process.exit(-1);
}

const CONFIG = value;

const filePath = CONFIG.paths.files;
const uploadPath = CONFIG.paths.tmp;
const thumbnailPath = CONFIG.paths.thumbnails;
const tsNode = Path.extname(__filename) == ".ts";
const assetsPath = Path.join(__dirname,  "..", tsNode ? "../dist" : "", "public");
const jsonParser = bodyParser.json();
const upload = Multer({dest: uploadPath})

async function init(){
	if(!await Util.promisify(FS.exists)(filePath)){
		await Util.promisify(FS.mkdir)(filePath);
	}
	if(!await Util.promisify(FS.exists)(uploadPath)){
		await Util.promisify(FS.mkdir)(uploadPath);
	}
	if(!await Util.promisify(FS.exists)(thumbnailPath)){
		await Util.promisify(FS.mkdir)(thumbnailPath);
	}
	const db = await createConnection({
		type: "mysql", 
		database: CONFIG.mysql.database,
		username: CONFIG.mysql.user,
		password: CONFIG.mysql.password,
		synchronize: true,
		//debug:true,
		charset: "utf8",
		entities: [Tag, Document, Meta, MetaData, File, Keyword],
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

	app.use(ZIP());

	initTagRoutes(app, jsonParser);
	initMetaRoutes(app, jsonParser)
	initUiRoutes(app, assetsPath);
	initDocRoutes(app, jsonParser, filePath, upload)
	initFileRoutes(app, filePath, upload);
	
	app.get('/api/dates', async (req, res)=>{
		//TODO
	});

	await new Promise((res,rej)=>app.listen(3000, ()=>res()));
}

init();