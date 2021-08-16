import {Express} from "express";
import { NextHandleFunction } from "connect";
import * as JOI from "joi";
import { Server } from "../server";
import { Tag } from "../entities/tag";
import { Document } from "../entities/document";

export default function init(server: Server){
    // Tags get, delete, add
	server.app.delete('/api/tags/:tag', async (req, res)=>{
		let tags = await Tag.find({id: req.params.tag});
		if(tags.length == 0){
			res.status(404).send("Tag not found");
		}else{
			await tags[0].remove();
			let docs = await Document.find();
			for(let doc of docs){
				let index = doc.tags.findIndex(t=>t.id==req.params.tag);
				if(typeof doc.tags[0] == "string")
					throw new Error('tags are strings');
				if(index > -1){
					doc.tags.splice(index);
					doc.save();
				}
			}
			res.status(200);
		}
		res.end();
	});
	server.app.post('/api/tags', server.jsonParser, async (req, res)=>{
		if(req.header("Content-Type") != "application/json"){
			res.status(422).send("Expecting json body!");
			return;
		}
		let {value, error} = JOI.object({
			"id": JOI.string().min(1).max(20)
				.regex(/[a-z0-9]+/).required(),
			"title": JOI.string().min(1).required(),
			"color": JOI.string().regex(/^[A-F0-9]{6}$/).required()
		}).validate(req.body);
		if(error){
			res.status(422).send(error.message);
			return;
		}
		let tag = new Tag();
		tag.id = value.id;
		tag.title = value.title;
		tag.color = value.color;
		await tag.save();
		res.end();
	})
}