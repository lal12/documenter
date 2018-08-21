import {httpRequest} from "./api";
import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import Tabs from "antd/lib/tabs";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import DateTime from "react-datetime";
import {EditInput} from "./edit-input"
import Tag from "antd/lib/tag";
import Select from "react-select";



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
	tags: string[],
	autoKeywords: string[],
	customKeywords: string[],
	origFilename: string
};

export default class DocEditView extends React.Component<{uuid: string}>{
	state: {doc: document|null, tags: tag[]};
	constructor(props: {uuid: string}){
		super(props);
		this.state = {doc: null, tags: []};
	}
	componentDidMount(){
		this.refresh();
	}
	refresh(){
		httpRequest("GET", "/api/tags").then(d=>{
			this.setState({tags: d});
			return httpRequest("GET", "/api/docs/"+this.props.uuid)
		}).then(d=>{
			d = {
				...d, 
				added: new Date(d.added),
				modified: new Date(d.modified),
				documentDate: new Date(d.documentDate)
			};
			this.setState({doc: d})
		})
	}
	id2tag(id:string){
		let index = this.state.tags.findIndex(t=>t.id == id);
		if(index > -1)
			return this.state.tags[index];
		return null;
	}
	save(){
		let doc = this.state.doc;
		if(doc){
			let docPart = {
				title: doc.title,
				customKeywords: doc.customKeywords,
				documentDate: doc.documentDate,
				tags: doc.tags
			}
			httpRequest("PUT", "/api/docs/"+doc.uuid, docPart).then(()=>this.refresh());
		}
	}
	saveKeywords(keywords:string){
		if(this.state.doc){
			this.state.doc.customKeywords = keywords.split(",").map(s=>s.trim());
			this.save();
		}
	}
	saveTitle(title:string){
		if(this.state.doc){
			this.state.doc.title = title.trim();
			this.save();
		}
	}
	saveDocDate(date:string){
		if(this.state.doc){
			this.state.doc.documentDate = new Date(date);
			this.save();
		}
	}
	saveTags(tags:string[]){
		if(this.state.doc){
			this.state.doc.tags = tags;
			this.save();
		}
	}
	renderEditTitle(doc: document){
		return(<EditInput<string> 
			initValue={doc.title}
			onSave={(v)=>this.saveTitle(v)}
			renderDisplay={(v: string, edit: ()=>void)=>(
				<React.Fragment>
					{v}
					<Button onClick={edit}
						style={{marginLeft: "6px"}}
						type="primary" size="small"
					>
						<Icon type="edit" />
					</Button>
				</React.Fragment>
			)} 
			renderEdit={(v: string, save: ()=>void, abort: ()=>void, change:(v:string)=>void)=>(
				<React.Fragment>
					<Input style={{width: "auto"}}
						type="text" value={v}
						onChange={(e)=>change(e.target.value)}
					/>
					<Button onClick={save}  
						style={{display: "table-cell"}}
						type="primary" 
					>
						<Icon type="save" />
					</Button>
					<Button onClick={abort} 
						style={{display: "table-cell"}}
						type="danger" 
					>
						<Icon type="close" />
					</Button>
				</React.Fragment>
			)}
		/>);
	}
	renderEditKeywords(doc: document){
		return(<EditInput<string>
			initValue={doc.customKeywords.join(",")}
			onSave={(v)=>this.saveKeywords(v)}
			renderDisplay={(v: string, edit: ()=>void)=>(
				<React.Fragment>
					{v}
					<Button onClick={edit}
						style={{marginLeft: "6px"}}
						type="primary" size="small"
					>
						<Icon type="edit" />
					</Button>
				</React.Fragment>
			)} 
			renderEdit={(v: string, save: ()=>void, abort: ()=>void, change:(v:string)=>void)=>(
				<React.Fragment>
					<Input.TextArea style={{width: "auto"}}
						value={v} onChange={(e)=>change(e.target.value)}
					/><br />
					<Button onClick={save}  
						style={{display: "table-cell"}} type="primary" 
					>
						<Icon type="save" />
					</Button>
					<Button onClick={abort} 
						style={{display: "table-cell"}} type="danger" 
					>
						<Icon type="close" />
					</Button>
				</React.Fragment>
			)}
		/>);
	}
	renderEditDocDate(doc: document){
		return(<EditInput<string>
			initValue={doc.documentDate.toISOString()}
			onSave={(v)=>this.saveDocDate(v)}
			renderDisplay={(v: string, edit: ()=>void)=>(
				<React.Fragment>
					{(new Date(v)).toLocaleString()}
					<Button onClick={edit}
						style={{marginLeft: "6px"}} type="primary" size="small"
					>
						<Icon type="edit" />
					</Button>
				</React.Fragment>
			)} 
			renderEdit={(v: string, save: ()=>void, abort: ()=>void, change:(v:string)=>void)=>(
				<React.Fragment>
					<DateTime onChange={(e)=>change(e as string)} value={new Date(v)} locale="de"/>
					<Button onClick={save} type="primary"><Icon type="save" /></Button>
					<Button onClick={abort} type="danger"><Icon type="close" /></Button>
				</React.Fragment>
			)}
		/>);
	}
	renderEditTags(doc:document){
		const tags2vals = (tags:tag[])=>tags.map(t=>({label:t.title,value:t.id}));
		const ids2vals = (ids:string[])=>ids.map(id=>({value:id,label:(this.id2tag(id) as tag).id}))
		const vals2tags = (vals:{label:string,value:string}[])=>vals.map(v=>({id:v.value,title:v.label}));
		const vals2ids = (vals:{label:string,value:string}[])=>vals.map(v=>v.value);
		
		return(<EditInput<string[]> 
			initValue={doc.tags}
			onSave={tags=>this.saveTags(tags)}
			renderDisplay={(ids: string[], edit: ()=>void)=>(
				<React.Fragment>
					{ids.map(id=>(<Tag>{(this.id2tag(id) as tag).title}</Tag>))}
					<Button onClick={edit}
						style={{marginLeft: "6px"}}
						type="primary" size="small"
					>
						<Icon type="edit" />
					</Button>
				</React.Fragment>
			)} 
			renderEdit={(ids:string[], save: ()=>void, abort: ()=>void, change:(v:string[])=>void)=>(
				<React.Fragment>
					<div style={{display: "inline-block"}}><Select isMulti
						options={tags2vals(this.state.tags)} 
						defaultValue={ids2vals(ids)}
						onChange={(a:any)=>change(vals2ids(a))}
						/></div>
					<Button onClick={save}  
						style={{display: "table-cell"}}
						type="primary" size="large"
					>
						<Icon type="save" />
					</Button>
					<Button onClick={abort} 
						style={{display: "table-cell"}}
						type="danger" size="large"
					>
						<Icon type="close" />
					</Button>
				</React.Fragment>
			)}
		/>);
	}
	render(){
		if(this.state.doc == null)
			return null;
		let doc = this.state.doc as document;

		return(<div style={{
			backgroundColor: "white",
			margin: "2vw",
			padding: "1vw"
		}}>
			<div>
				<h1 style={{display: "inline-block"}}>{doc.title}</h1>
				<a href={"/api/docs/"+doc.uuid+"/file"} style={{marginLeft: "10px"}}>
					<Button>
						<Icon type="download"/>
					</Button>
				</a>
				<Button type="danger" style={{marginLeft: "10px"}}
					onClick={()=>{
						if(confirm("Wirklich das Dokument '"+doc.title+"' löschen?")){
							httpRequest("DELETE", "/api/docs/"+doc.uuid).then(()=>{
								window.location.href = "/ui/docs";
							})
						}
					}}
				>
					<Icon type="delete"/>
				</Button>
			</div>
			<Tabs defaultActiveKey="1">
				<Tabs.TabPane tab="Übersicht" key="1">
					<table style={{overflow: "visible"}}><tbody>
						<tr>
							<td><b>Titel: </b></td>
							<td>{this.renderEditTitle(doc)}</td>
						</tr><tr>
							<td><b>Dateiname: </b></td>
							<td>{doc.origFilename}</td>
						</tr><tr>
							<td><b>Dokumentendatum: </b></td>
							<td>{this.renderEditDocDate(doc)}</td>
						</tr><tr>
							<td><b>Hinzugefügt am: </b></td>
							<td>{doc.added.toLocaleString()}</td>
						</tr><tr>
							<td><b>Zuletzt Bearbeitet: </b></td>
							<td>{doc.modified.toLocaleString()}</td>
						</tr><tr>
							<td><b>Keywords: </b></td>
							<td>{this.renderEditKeywords(doc)}</td>
						</tr><tr>
							<td><b>Tags: </b></td>
							<td>{this.renderEditTags(doc)}</td>
						</tr>
					</tbody></table>
				</Tabs.TabPane>
				<Tabs.TabPane tab="Anschauen" key="2">
					
				</Tabs.TabPane>
			</Tabs>
		</div>);
	}
}