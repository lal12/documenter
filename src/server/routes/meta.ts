import * as JOI from "joi";
import { Server } from "../server";
import { Meta } from "../entities/meta";

export default function init(server: Server){
	const app = server.app;
    // Meta delete, add
	app.delete('/api/metas/:meta', async (req, res)=>{
		let meta = await Meta.find({id: req.params.meta});
		if(meta.length == 0){
			res.status(404).send("Meta not found");
		}else if(!meta[0].deletable){
			res.status(403).send("Meta is not deletable");
		}else{
			await meta[0].remove();
			res.status(200);
		}
		res.end();
	});
	app.post('/api/metas', server.jsonParser, async (req, res)=>{
		if(req.header("Content-Type") != "application/json"){
			res.status(422).send("Expecting json body!");
			return;
		}
		let {value: { title, isArray, required, type, /*forTag*/}, error} = JOI.object({ 
			title: JOI.string().min(1).required(), 
			isArray: JOI.bool().required(),
			required: JOI.bool().required(),
			type: JOI.string().valid(...[
				"date","string","uint","int","decimal"
			]).required(),
			//forTag: JOI.array().items(JOI.string()).allow(null)
		}).validate(req.body);
		if(error){
			res.status(422).send(error.message);
			return;
		}
		let id = title.toLowerCase().replace(/[^a-z0-9]/, "");
		if(id.length < 5){
			res.status(422).send("resulting id is to short!");
			return;
		}
		let meta = new Meta();
		meta.id = id;
		meta.title = title;
		meta.isArray = isArray;
		meta.deletable = true;
		meta.type = type;
		meta.required = required;
		//meta.forTag = forTag;
		await meta.save();
		res.end();
	})
}
