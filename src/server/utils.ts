import * as FS from "fs";

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