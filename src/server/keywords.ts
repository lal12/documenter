import * as FS from "fs-extra";
import * as Path from "path";
import * as Textract from "textract";
import * as Tokenizer from "wink-tokenizer";
import { Keyword } from "./entities/keyword";

function extractTextFromBuffer(name:string,buffer:Buffer): Promise<string>{
	return new Promise((res,rej)=>{
		Textract.fromBufferWithName(name,buffer,(err, text)=>{
			if(err)
				rej(err);
			else
				res(text);
		})
	})
}

function textFromTxt(data:Buffer){
	return data.toString("utf8");
}

export async function textFromFile(path: string, origFilename: string): Promise<string>{
	let data = await FS.readFile(path);
	let ext = Path.extname(origFilename).substr(1);
	switch(ext){
		case "txt":
			return textFromTxt(data);
		case 'md':
		case 'odt': // LibreOffice Text file
		case 'ods': // LibreOffice Sheet (Calc) file
		case 'docx': // Microsoft Office Word file
		case 'xlsx': // Microsoft Office Excel file
			return await extractTextFromBuffer(origFilename, data)
		case 'pdf': // PDF file
			let text = await extractTextFromBuffer(origFilename, data)
			if(text.trim().replace(/[^\w]/, "").length < 2)
				throw new Error('Cannot get text from '+path);
			return text;
		default:
			throw new Error("Invalid file extension: "+ext);
	}
}

export function keywordsFromText(text: string): string[]{
	let tokenizer = new Tokenizer();
	let tokens = tokenizer.tokenize(text);
	let keywords = tokens
		.filter(t=>t.value.length > 1)
		.filter(t=>t.tag != "punctuation")
		.filter(t=>t.tag != "alien")
		.map(t=>t.value.toLowerCase());
	return Array.from(new Set(keywords));
}

export async function insertNonExistingKeywords(kws: string[]){
	kws = Array.from(new Set(kws));
	return await Promise.all(kws.map(async kw=>{
		let dbKws = (await Keyword.find({keyword: kw})).filter(dbkw=>dbkw.keyword == kw);  
		// Fixed problems with umlauts by filtering the results
		if(dbKws.length > 1){
			console.warn("Multiple keywords found: ", kw, dbKws);
		}
		let dbKw = dbKws[0];
		if(!dbKw){
			dbKw = new Keyword();
			dbKw.keyword = kw;
			await dbKw.save();
		}
		return dbKw;
	}));
}