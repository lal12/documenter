import * as FS from 'fs-extra';
import * as Path from 'path';
import * as Which from "which";
import * as ChildProcess from 'child_process';
import * as isexe from 'isexe';

async function getExecPath(name: string){
	if(name.indexOf("/") > -1){
		if(await isexe(name)){
			return name;
		}else{
			return null;
		}
	}else{
		let path = await Which(name);
		if(path)
			return path;
		else
			return null;
	}
}


export interface BaseConfig{
	width?: number;
	height?: number;
	imagemagickPath?: string;
}

export interface DocPreviewConf extends BaseConfig{
	unoconvPath?: string;
}


export async function docPreview(filepath: string, conf: DocPreviewConf = {}){
	if(!conf)
		conf = {};
	let stat = await FS.stat(filepath);
	if(!stat.isFile()){
		throw new Error("Path is not a file: "+filepath);
	}
	let unoconv = await getExecPath(conf.unoconvPath ? conf.unoconvPath : "unoconv")
	if(!unoconv)
		throw new Error("unoconv not available!");
	let imagemagick = await getExecPath(conf.imagemagickPath ? conf.imagemagickPath : "convert")
	if(!imagemagick)
		throw new Error("imagemagick convert not available!");
	let outpdf = ChildProcess.spawn(unoconv, [
		"-f", "pdf",
		"-e", "PageRange=1",
		"--stdout",
		filepath
	],{
		stdio: ['ignore', 'pipe', 'pipe'],
	});
	outpdf.on('error', (e)=>console.warn('failed to run unoconv!', e))
	let size = "x";
	if(!conf.width && !conf.height)
		size = "x300";
	else
		size = (conf.width ? conf.width : "") + "x" + (conf.height ? conf.height : "");
	let thumbout = ChildProcess.spawn(imagemagick, [
		"-thumbnail", size,
		"-background", "white",
		"-alpha", "remove",
		"pdf:-",
		"jpeg:-"
	], {
		stdio: [outpdf.stdout, 'pipe', 'pipe']
	});
	thumbout.on('error', (e)=>console.warn('failed to run convert!', e))
	return thumbout.stdout;
}

export async function imgPreview(filepath: string, conf: BaseConfig = {}){
	let stat = await FS.stat(filepath);
	if(!stat.isFile()){
		throw new Error("Path is not a file: "+filepath);
	}
	let imagemagick  = await getExecPath(conf.imagemagickPath ? conf.imagemagickPath : "convert")
	if(!imagemagick)
		throw new Error("imagemagick convert not available!");
	let size = "x";
	if(!conf.width && !conf.height)
		size = "x300";
	else
		size = (conf.width ? conf.width : "") + "x" + (conf.height ? conf.height : "");
	let thumbout = ChildProcess.spawn(imagemagick, [
		"-thumbnail", size,
		"-background", "white",
		"-alpha", "remove",
		Path.resolve(filepath),
		"jpeg:-"
	], {
		stdio: ['ignore', 'pipe', 'ignore']
	});
	return thumbout.stdout;
} 
