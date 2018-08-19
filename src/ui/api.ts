export function httpRequest(method: string, url: string, data?: any) : Promise<any>{
	return new Promise((res,rej)=>{
		if(data){
			let reqData : string|null = JSON.stringify(data);
			if(method.toUpperCase() == "GET"){
				data = null;
				url += "?";
				let urlparts = [];
				for(let prop in data){
					if(typeof(data[prop]) == "string"){
						urlparts.push(prop+"="+encodeURIComponent(data[prop]));
					}else{
						urlparts.push(prop+"="+encodeURIComponent(JSON.stringify(data[prop])));
					}
				}
				url += urlparts.join("&");
			}
		}
		let req = new XMLHttpRequest();
		req.overrideMimeType("application/json");
		req.addEventListener("load", ()=>{
			if(req.readyState == 4){
				if(req.status == 200){
					if(req.responseText && req.responseText.length > 0)
						res(JSON.parse(req.responseText));
					else
						res(null);
				}else{
					rej(req.responseText);
				}
			}
		});
		req.open(method.toUpperCase(), url, true);
		req.setRequestHeader("Accept", "application/json");
		if(data){ 
			req.setRequestHeader("Content-Type", "application/json");
			req.send(JSON.stringify(data));
		}else{
			req.send(); 
		}
	});
}