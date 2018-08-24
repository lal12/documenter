import * as FS from "fs";
import * as Util from "util";
import * as Path from "path";
import * as Textract from "textract";
import { Keyword } from "./entities";
import * as Tokenizer from "wink-tokenizer";

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
    let data = (await Util.promisify(FS.readFile)(path));
    let ext = Path.extname(path).substr(1);
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
            throw "Not implemented yet!"
        case 'pdf': // PDF file which needs OCR
        case 'png': // Image files
        case 'jpg':
            throw "Not implemented yet!"
        default:
            throw new Error("Invalid file extension: "+ext);
    }
}

type token = {
    value: string, tag: "word"|"email"|"alien"|"number"|"punctuation"
}
export function keywordsFromText(text: string): string[]{
    let tokenizer = new Tokenizer();
    /*
    let onlyDashRegex = /^[\-_]*$/;
    let dashUnderscoreRegex = /[-_]/;
    let keywords = text.split(/[^\w\-\.,]/)
        .map(kw=>kw.trim().toLowerCase())
        .filter(kw=>kw.length>0)
        .filter(kw=>!kw.match(onlyDashRegex));
    // Filter out duplicates
    keywords = Array.from(new Set(keywords)); 
    // Add keywords with seperators also as divided keywords
    keywords
        .filter(kw=>kw.match(dashUnderscoreRegex))
        .map(kw=>kw.split(dashUnderscoreRegex))
        .forEach(kws=>{
            keywords = keywords.concat(kws);
        });
    // Split any words concenated by dot or comma
    keywords
        .filter(kw.match(/\d*\.\d+/))
        .filter(kw=>kw.match())
        */
    let tokens : token[]= tokenizer.tokenize(text);
    let keywords = tokens
        .filter(t=>t.value.length > 1)
        .filter(t=>t.tag != "punctuation")
        .filter(t=>t.tag != "alien")
        .map(t=>t.value.toLowerCase());
    return Array.from(new Set(keywords));
}

export function insertNonExistingKeywords(kws: string[]){
    return Promise.all(kws.map(async kw=>{
        let dbKw = await Keyword.findOne({keyword: kw});
        if(!dbKw){
            dbKw = new Keyword();
            dbKw.keyword = kw;
            await dbKw.save();
        }
        return dbKw;
    }));
}