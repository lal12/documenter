import React from "react";
import "antd/dist/antd.css";

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

export function GraphQLQuery(query: string, variables?: {[key:string]: any}, operationName?: string) : Promise<any>{
    return new Promise((res,rej)=>{
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = ()=>{
			if(xhr.readyState == 4){
				let d = JSON.parse(xhr.response);
				if(d.errors){
					rej(d);
				}else{
					res(d.data);
				}
			}
		};
		xhr.open("POST", "/graphql");
		xhr.setRequestHeader("Content-Type", "application/json")
		xhr.setRequestHeader("Accept", "application/json")
		xhr.send(JSON.stringify({
			query: query,
			variables,
			operationName
		}));
    });
}

export function useGQL<T extends {[index: string]: any} = any>(query: string, variables: {[key:string]: any} = {}, operationName?: string, def: T = ({} as any)): [T, ()=>Promise<void>]{
	const [data, setData] = React.useState<T>(def);
	async function load(){
		const data = await GraphQLQuery(query, variables, operationName);
		setData(data);
	}
	React.useEffect(()=>{
		load();
	}, [query, ...Object.keys(variables), ...Object.values(variables).map(v=>JSON.stringify(v)), operationName]);
	return [data, load];
}
