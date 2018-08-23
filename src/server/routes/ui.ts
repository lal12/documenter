import {Express} from "express";
import * as Path from "path";

export default function init(app: Express, assetsPath: string){
    app.get("/ui*", async (req, res)=>{
		res.sendFile(Path.join(assetsPath, "index.html"));
	})
	app.get("/assets/:path", async (req, res)=>{
		if(req.params.path.indexOf("/") > -1)
			res.status(422);
		else
			res.sendFile(Path.join(assetsPath, req.params.path));
	})
}