import {Express} from "express";
import { Tag, Document } from "../entities";
import { NextHandleFunction } from "connect";
import * as JOI from "joi";

export default function init(app: Express, jsonParser: NextHandleFunction){
    // Tags get, delete, add
	app.get('/api/tags', async (req, res)=>{
		let tags = await Tag.find();
		tags.map( t=>({name: t.id, title: t.title}) )
		res.json(tags);
	});
	app.delete('/api/tags/:tag', async (req, res)=>{
		let tags = await Tag.find({id: req.params.tag});
		if(tags.length == 0){
			res.status(404).send("Tag not found");
		}else{
			await tags[0].remove();
			let docs = await Document.find();
			for(let doc of docs){
				let index = doc.tags.indexOf(req.params.tag);
				if(index > -1){
					doc.tags.splice(index);
					doc.save();
				}
			}
			res.status(200);
		}
		res.end();
	});
	app.post('/api/tags', jsonParser, async (req, res)=>{
		if(req.header("Content-Type") != "application/json"){
			res.status(422).send("Expecting json body!");
			return;
		}
		let {value, error} = JOI.object({
			"id": JOI.string().min(1).max(20)
				.regex(/[a-z0-9]+/).required(),
			"title": JOI.string().min(1).required()
		}).validate(req.body);
		if(error){
			res.status(422).send(error.message);
			return;
		}
		let tag = new Tag();
		tag.id = value.id;
		tag.title = value.title;
		await tag.save();
		res.end();
	})
}