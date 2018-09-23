import * as FS from "fs";
import * as Util from "util";
import * as ChildProc from "child_process";


export function move(oldPath: string, newPath: string): Promise<"copy"|"rename">{
	return new Promise((res,rej)=>{
		FS.rename(oldPath, newPath, function (err) {
			if (err) {
				if (err.code === 'EXDEV') {
					copy();
				} else {
					rej(err);
				}
				return;
			}
			res("rename");
		});
		function copy() {
			var readStream = FS.createReadStream(oldPath);
			var writeStream = FS.createWriteStream(newPath);
			readStream.on('error', (err)=>rej(err));
			writeStream.on('error', (err)=>rej(err));
			readStream.on('close', function () {
				FS.unlink(oldPath, ()=>res("copy"));
			});
			readStream.pipe(writeStream);
		}
	})
}

let tesseractBin: string;
export async function runOCR(inpath: string, outpath: string){
	if(!tesseractBin){
		tesseractBin = (await Util.promisify(ChildProc.exec)("which tesseract")).stdout.trim();
	}
	let r = await Util.promisify(ChildProc.execFile)(tesseractBin, [
		inpath, outpath, "pdf"
	]);
}