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
import { Server } from "./server";

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
	}).required(),
	server: JOI.object({
		port: JOI.number().min(1).max(0xFFFF).default(3000)
	}).default({port: 3000})
}).validate(require(Path.join(process.cwd(),"config.json")));

if(error){
	console.error("Invalid config: ", error.message);
	process.exit(-1);
}

const CONFIG = value;
const tsNode = Path.extname(__filename) == ".ts";


async function init(){
	const server : Server = {
		tmpPath: CONFIG.paths.tmp,
		filesPath: CONFIG.paths.files,
		thumbnailPath: CONFIG.paths.thumbnails,
		assetsPath: Path.join(__dirname,  "..", tsNode ? "../dist" : "", "public"),
		upload: Multer({dest: CONFIG.paths.tmp}),
		jsonParser: bodyParser.json(),
		app: null!
	}
	if(!await Util.promisify(FS.exists)(server.filesPath)){
		await Util.promisify(FS.mkdir)(server.filesPath);
	}
	if(!await Util.promisify(FS.exists)(server.tmpPath)){
		await Util.promisify(FS.mkdir)(server.tmpPath);
	}
	if(!await Util.promisify(FS.exists)(server.thumbnailPath)){
		await Util.promisify(FS.mkdir)(server.thumbnailPath);
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


	server.app = express();
	server.app.use(ZIP());

	initTagRoutes(server);
	initMetaRoutes(server)
	initUiRoutes(server);
	initDocRoutes(server)
	initFileRoutes(server);
	
	server.app.get('/api/dates', async (req, res)=>{
		//TODO
	});

	await new Promise((res,rej)=>server.app.listen(CONFIG.server.port, ()=>res()));
}

init();