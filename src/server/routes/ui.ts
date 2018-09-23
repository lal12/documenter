import {Express} from "express";
import * as Path from "path";
import { Server } from "../server";

export default function init(server: Server){
	server.app.get("/", async (req, res)=>{
		res.redirect("/ui/docs")
	})
    server.app.get("/ui*", async (req, res)=>{
		if(req.path == "/ui/lang.json"){
			let lang = "de"; //TODO: dynamic language
			res.sendFile(Path.resolve(server.assetsPath, "lang", lang+".json"));
		}else{
			res.sendFile(Path.join(server.assetsPath, "index.html"));
		}
	})
	server.app.get("/assets/:path", async (req, res)=>{
		if(req.params.path.indexOf("/") > -1)
			res.status(422);
		else try{
			res.sendFile(Path.join(server.assetsPath, req.params.path));
		}catch(e){
			res.status(404);
		}
	})
}