import {httpRequest} from "./api";
import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import Tabs from "antd/lib/tabs";
import Moment from "moment";
import Input from "antd/lib/input";
import DateTime from "react-datetime";
import {EditInput, EditTextInput, EditNumberInput, EditDateInput, EditDateTimeInput} from "./edit-input"
import Tag from "antd/lib/tag";
import Select from "react-select";
import Divider from "antd/lib/divider";

import {intl} from "../lang/intl";

type tag = {
	id: string,
	title: string
}

interface metadata{
	id: string,
	title: string,
	type: string,
	optional: boolean,
	isArray: boolean,
	value?: string|string[]
}
interface metadataArray extends metadata{
	isArray: true,
	value: string[]
}
interface metadataSingle extends metadata{
	isArray: false,
	value: string
}
interface document{
	uuid: string,
	added: Date,
	modified: Date,
	documentDate: Date,
	metadata: metadata[],
	title: string,
	tags: string[],
	keywords: string[],
	files: {
		name: string,
		uuid: string
	}[]
};

function strToVal(val: string, type: string): string|number|Date{
	switch(type){
		case "string":
			return val;
		case "uint":
		case "int":
			return parseInt(val);
		case "decimal":
			return parseFloat(val);
		case "date":
		case "datetime":
			return new Date(val);
		default:
			throw new Error("Unknown type: "+type);
	}
}

class EditMetadataArray extends React.Component<{md: metadataArray}>{

}

class EditMetadata extends React.Component<{
	md: metadataSingle, 
	onSave?: (v:string|number|Date)=>void
}>{
	save(value: string|number|Date){
		if(this.props.onSave){
			this.props.onSave(value);
		}
	}
	render(){
		let md = this.props.md;
		let val = strToVal(md.value, md.type);
		if(md.type == "string"){
			return <EditTextInput 
				initValue={md.value} 
				label="" type="string"
				onSave={v=>this.save(v)} />;
		}else if(md.type == "uint" || md.type == "int" || md.type == "decimal"){
			let min, step;
			if(md.type == "uint")
				min = 0;
			if(md.type == "int" || md.type == "uint")
				step = 1;
			return <EditNumberInput  
				initValue={val as number} 
				min={min} step={step} 
				onSave={v=>this.save(v)} />;
		}else if(md.type == "date"){
			return <EditDateInput 
				initValue={Moment(val)} 
				onSave={v=>this.save(v.toDate())} />
		}else if(md.type == "datetime"){
			return <EditDateTimeInput 
				initValue={Moment(val)}
				onSave={v=>this.save(v.toDate())} />
		}
	}
}

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
			let metadata : {[index:string]:string|string[]} = {};
			for(let m of doc.metadata)
				metadata[m.id] = m.value!;
			let docPart = {
				title: doc.title,
				documentDate: doc.documentDate,
				tags: doc.tags,
				metadata
			}
			httpRequest("PUT", "/api/docs/"+doc.uuid, docPart).then(()=>this.refresh());
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
	saveAttribute(md: metadata, i: number){
		if(this.state.doc){
			this.state.doc.metadata[i] = md;
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
	renderAttribute(md: metadata, i:number){
		if(!md.isArray){
			return <tr>
				<td><b>{md.title+": "}</b></td>
				<td>
				<EditMetadata 
					md={md as metadataSingle}
					onSave={(v:Date|number|string)=>{
						if(v instanceof Date)
							v = v.toISOString();
						else
							v = v.toString();
						this.saveAttribute({...md, value: v}, i)}
					} />
				</td>
			</tr>;
		}
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

		return(<div className="content">
			<div>
				<h1 style={{display: "inline-block"}}>{doc.title}</h1>
				<a href={"/api/docs/"+doc.uuid+"/files/zip"} style={{marginLeft: "10px"}}>
					<Button>
						<Icon type="download"/>
					</Button>
				</a>
				<Button type="danger" style={{marginLeft: "10px"}}
					onClick={()=>{
						if(confirm(intl.get("doc_confirm_del", doc))){
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
				<Tabs.TabPane tab={intl.get("details")} key="1">
					<table style={{overflow: "visible"}}><tbody>
						<tr>
							<td><b>{intl.get("title")}: </b></td>
							<td>{this.renderEditTitle(doc)}</td>
						</tr><tr>
							<td><b>{intl.get("files")}: </b></td>
							<td>{doc.files.map(f=>(
								<a href={"/api/files/"+f.uuid} 
									style={{marginRight: "10px"}}>
									{f.name}
								</a>
							))}</td>
						</tr><tr>
							<td><b>{intl.get("created")}: </b></td>
							<td>{this.renderEditDocDate(doc)}</td>
						</tr><tr>
							<td><b>{intl.get("added")}: </b></td>
							<td>{intl.datetime(doc.added)}</td>
						</tr><tr>
							<td><b>{intl.get("modified")}: </b></td>
							<td>{intl.datetime(doc.modified)}</td>
						</tr><tr>
							<td><b>{intl.get("keywords")}: </b></td>
							<td>{this.state.doc.keywords.join(", ")}</td>
						</tr><tr>
							<td><b>{intl.get("tags")}: </b></td>
							<td>{this.renderEditTags(doc)}</td>
						</tr>
					</tbody></table>
					<Divider style={{marginTop: "15px"}} />
					<h2>{intl.get("menu_meta")}</h2>
					<table><tbody>
						{this.state.doc.metadata.map((md,i)=>this.renderAttribute(md,i))}
					</tbody></table>
				</Tabs.TabPane>
				<Tabs.TabPane tab={intl.get("view")} key="2">
					
				</Tabs.TabPane>
			</Tabs>
		</div>);
	}
}