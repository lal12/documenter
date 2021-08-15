import * as express from "express";
import * as Path from "path";
import * as FS from "fs-extra";
import {createConnection} from "typeorm";
import * as JOI from "joi";
import {json as JSONParser} from "body-parser";
import * as Multer from "multer";
const ZIP = require("express-easy-zip");
import { buildSchema } from "type-graphql";
import * as graphqlHTTP from 'express-graphql';

import initTagRoutes from "./routes/tags";
import initMetaRoutes from "./routes/meta";
import initUiRoutes from "./routes/ui";
import initDocRoutes from "./routes/docs";
import initFileRoutes from "./routes/files";
import { Server, setServer } from "./server";
import { Meta } from "./entities/meta";

const configPath = Path.join(process.cwd(),"config.json");

const {value, error} = JOI.object({
	data: JOI.string().min(1).required(),
	tmp: JOI.string().min(1).optional(),
	server: JOI.object({
		port: JOI.number().min(1).max(0xFFFF).default(3000)
	}).default({port: 3000})
}).validate(require(configPath));

interface Config{
	data: string,
	tmp: string,
	server: {
		port: number
	}
}

if(error){
	console.error("Invalid config: ", error.message);
	process.exit(-1);
}

const CONFIG: Config = value;
CONFIG.data = Path.resolve(Path.dirname(configPath), CONFIG.data);
if(CONFIG.tmp){
	CONFIG.tmp = Path.resolve(Path.dirname(configPath), CONFIG.tmp);
}else{
	CONFIG.tmp = Path.join(CONFIG.data, 'tmp');
}

const tsNode = Path.extname(__filename) == ".ts";

async function checkDir(path: string){
	let st: FS.Stats;
	try{
		st = await FS.stat(path);
	}catch(e){
		return false;
	}
	if(!st.isDirectory())
		throw new Error(`Path "${path}" exists, but is not a directory!`);
	return true;
}

async function init(){
	const server : Server = {
		tmpPath: CONFIG.tmp,
		filesPath: Path.join(CONFIG.data, 'files'),
		thumbnailPath: Path.join(CONFIG.data, 'thumbnails'),
		assetsPath: Path.join(__dirname,  "..", tsNode ? "../dist" : "", "public"),
		upload: Multer({dest: CONFIG.tmp}),
		jsonParser: JSONParser(),
		app: null!
	}
	setServer(server);
	if(!await checkDir(server.filesPath)){
		await FS.mkdirp(server.filesPath);
	}
	if(!await checkDir(server.tmpPath)){
		await FS.mkdirp(server.tmpPath);
	}
	if(!await checkDir(server.thumbnailPath)){
		await FS.mkdirp(server.thumbnailPath);
	}
	const db = 	await createConnection({
		type: "better-sqlite3", 
		database: Path.join(CONFIG.data, 'db.sqlite'),
		synchronize: true,
		entities: [__dirname+"/entities/*.js"],
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

	const schema = await buildSchema({
		resolvers: [
			"./entitities/*.ts"
		],
		
	})
	server.app.use("/graphql", graphqlHTTP({
		schema: schema,
		graphiql: true
	}))

	initTagRoutes(server);
	initMetaRoutes(server)
	initUiRoutes(server);
	initDocRoutes(server)
	initFileRoutes(server);
	
	server.app.get('/api/dates', async (req, res)=>{
		//TODO
	});

	await new Promise<void>((res,rej)=>server.app.listen(CONFIG.server.port, ()=>res()));
	console.log('Listening to http://0.0.0.0:'+CONFIG.server.port);
}

init();