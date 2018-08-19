import {httpRequest} from "./api";
import * as React from "react";
import Table from "antd/lib/table";
import Tag from "antd/lib/tag";
import Column from "antd/lib/table/Column";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import Icon from "antd/lib/icon";
import Checkbox from "antd/lib/checkbox";

type tag = {
	id: string,
	title: string
}

type document = {
	uuid: string,
	added: Date,
	modified: Date,
	documentDate: Date,
	filetype: string,
	title: string,
	tags: tag[],
	autoKeywords: string[],
	customKeywords: string[]
};

export default class DocsView extends React.Component{
	state: {docs: document[]};
	constructor(props: any){
		super(props);
		this.state = {docs: []};
		this.refresh();
	}
	refresh(){
		httpRequest("GET", "/api/docs")
		.then((data:any)=>{
			data = data.map((d:document)=>({
				...d, 
				added: new Date(d.added),
				modified: new Date(d.modified),
				documentDate: new Date(d.documentDate)
			}));
			this.setState({docs: data})
		});
	}
	addDoc(){
		let finp = ((this.refs.fileinput as any).input as HTMLInputElement);
		if(finp.click){
			finp.click();
		}else{
			let evt = document.createEvent("MouseEvents");
			evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			finp.dispatchEvent(evt);
		}
	}
	onFileUpload(e: React.ChangeEvent<HTMLInputElement>){
		if(e.target.files){
			let file = e.target.files[0];
			let formData = new FormData();
			formData.append('file', file);
			new Promise<any>((res,rej)=>{
				let xhr = new XMLHttpRequest();
				xhr.addEventListener("load", ()=>{
					if(xhr.readyState == 4){
						if(xhr.status == 200){
							if(xhr.responseText && xhr.responseText.length > 0)
								res(JSON.parse(xhr.responseText));
							else
								res(null);
						}else{
							rej(xhr.responseText);
						}
					}
				})
				xhr.open("POST", "/api/docs/new", true);
				xhr.send(formData);
			}).then(d=>{
				window.location.href = "/ui/docs/"+d.uuid; 
			})
		}
	}
	render(){
		return(<div style={{
			backgroundColor: "white",
			margin: "2vw",
			padding: "1vw"
		}}>
			<h1>Dokumente</h1>
			<Input type="file" hidden={true} 
				ref="fileinput" onChange={e=>this.onFileUpload(e)} />
			<Button type="primary" onClick={()=>this.addDoc()}>Hinzufügen</Button>
			<Checkbox checked={true} style={{marginLeft: "10px"}}>
				Texterkennung für Bildinhalte aktivieren
			</Checkbox>
			<Table dataSource={this.state.docs}>
				<Column title="Titel" key="title" dataIndex="title" />
				<Column key="tags" dataIndex="tags" render={tags=>tags.map((t:tag)=>(
					<Tag key={t.id}>{t.title}</Tag>
				))} />
				<Column title="Erstellt" key="documentDate" dataIndex="documentDate"
					render={d=>d.toLocaleDateString()} />
				<Column title="Hinzugefügt" key="added" dataIndex="added" 
					render={d=>d.toLocaleDateString()} />
				<Column render={(uuid,doc: document)=>{
					return (<React.Fragment>
						<a href={"/ui/docs/"+uuid}>
							<Button><Icon type="edit"/></Button>
						</a>
						<a href={"/api/docs/"+uuid+"/file"}>
							<Button><Icon type="download"/></Button>
						</a>
						<Button onClick={()=>{
							if(confirm("Wollen Sie das Dokument '"+doc.title+"' wirklich löschen?")){
								httpRequest("DELETE", "/api/docs/"+uuid)
									.then(()=>this.refresh())
							}
						}}><Icon type="delete"/></Button>
					</React.Fragment>);
				}} dataIndex="uuid" />
			</Table>
		</div>);
	}

}