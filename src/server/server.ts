import * as Multer from "multer";
import { NextHandleFunction } from 'connect';
import {Express} from "express";

export interface Server{
	thumbnailPath: string,
	filesPath: string,
	tmpPath: string,
	assetsPath: string,
	upload: Multer.Multer,
	jsonParser: NextHandleFunction,
	app: Express,
}

let server: Server;
export function getServer(){
	return server;
}
export function setServer(s: Server){
	if(server)
		throw new Error('server is already set!');
	server = s;
}
