import {Express} from "express";
import * as Path from "path";

export default function init(app: Express, assetsPath: string){
    app.get("/ui*", async (req, res)=>{
		if(req.path == "/ui/lang.json"){
			let lang = "en";
			res.sendFile(Path.resolve(__dirname, "../../../src/lang", lang+".json"));
		}else{
			res.sendFile(Path.join(assetsPath, "index.html"));
		}
	})
	app.get("/assets/:path", async (req, res)=>{
		if(req.params.path.indexOf("/") > -1)
			res.status(422);
		else
			res.sendFile(Path.join(assetsPath, req.params.path));
	})
}