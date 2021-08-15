import {httpRequest, GraphQLQuery} from "./api";
import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import Tabs from "antd/lib/tabs";
import Input from "antd/lib/input";
import {EditInput, EditTextInput, EditNumberInput, EditDateInput, EditDateTimeInput} from "./edit-input"
import Tag from "antd/lib/tag";
import Select from "react-select";
import Divider from "antd/lib/divider";
import {MetaValueType} from '../shared/types';

import {intl} from "./intl";
import { DateTime } from "luxon";
import DatePicker, { registerLocale } from 'react-datepicker';
import { Col, Row } from "antd";

import de from 'date-fns/locale/de';
registerLocale('de', de)


type tag = {
	id: string,
	title: string
}

type anyMetadata = metadata<true>|metadata<false>;

interface metadata<arr extends Boolean> extends meta<arr>{
	value: string[]
}

interface meta<arr extends Boolean>{
	id: string,
	title: string,
	type: MetaValueType,
	optional: boolean,
	isArray: arr,
}
interface document{
	uuid: string,
	added: DateTime,
	modified: DateTime,
	documentDate: DateTime,
	attributes: anyMetadata[],
	title: string,
	tags: string[],
	files: {
		origFilename: string,
		uuid: string,
		keywords: string[],
		isTextFile: boolean|"?"
	}[]
};

function strToVal(val: string, type: MetaValueType): string|number|DateTime{
	switch(type){
		case MetaValueType.STRING:
			return val;
		case MetaValueType.UINT:
		case MetaValueType.INT:
			return parseInt(val);
		case MetaValueType.DECIMAL:
			return parseFloat(val);
		case MetaValueType.DATE:
		case MetaValueType.DATETIME:
			return DateTime.fromMillis(parseInt(val));
		default:
			throw new Error("Unknown type: "+type);
	}
}

class EditMetadataArray extends React.Component<metadata<true>>{

}

const CollapseLongText = (props: {text: string, maxLength: number})=>{
	const [collapsed, setCollapse] = React.useState(true);
	if(props.text.length <= props.maxLength)
		return <span>{props.text}</span>;
	const style = {
		textDecoration: 'underline',
		cursor: 'pointer',
		color: 'blue'
	}
	if(collapsed){
		return <span>
			{props.text.substr(0, props.maxLength-3)}...&nbsp;&nbsp;&nbsp;
			<span style={style} onClick={()=>setCollapse(false)}>&lt;Mehr&gt;</span>
		</span>;
	}else{
		return <span>
			{props.text}<br/>
			<span style={style} onClick={()=>setCollapse(true)}>&lt;Weniger&gt;</span>
		</span>;
	}
} 

class EditMetadata extends React.Component<{
	md: metadata<false>, 
	onSave?: (v:string|number|DateTime)=>void
}>{
	save(value: string|number|DateTime){
		if(this.props.onSave){
			this.props.onSave(value);
		}
	}
	render(){
		let md = this.props.md;
		let val = strToVal(md.value[0], md.type);
		if(md.type == "string"){
			return <EditTextInput 
				initValue={md.value[0]} 
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
				initValue={val as DateTime} 
				onSave={v=>this.save(v)} />
		}else if(md.type == "datetime"){
			return <EditDateTimeInput 
				initValue={val as DateTime}
				onSave={v=>this.save(v)} />
		}
	}
}

export default class DocEditView extends React.Component<{uuid: string}>{
	state: {doc: document|null, tags: tag[], uuid: string};
	constructor(props: {uuid: string}){
		super(props);
		this.state = {doc: null, tags: [], uuid: props.uuid};
	}
	componentDidMount(){
		this.refresh();
	}
	async refresh(){
		let data = await GraphQLQuery(`query($uuid:String!){
			tags{
				id
				title
			}
			document(uuid:$uuid){
				uuid
				added
				modified
				documentDate
				attributes{
					id
					title
					type
					optional
					isArray
					value
				}
				title
				tags{
					id
					title
				}
				files{
					origFilename
					uuid
          			keywords
				}
			}
		}`, {uuid: this.state.uuid});
		data.document.tags = data.document.tags.map((t:any)=>t.id);
		data.document.added = DateTime.fromMillis(data.document.added);
		data.document.modified = DateTime.fromMillis(data.document.modified);
		data.document.documentDate = DateTime.fromMillis(data.document.documentDate);
		this.setState({tags: data.tags, doc: data.document});
	}
	id2tag(id:string){
		return this.state.tags.find(t=>t.id == id);
	}
	save(){
		let doc = this.state.doc;
		if(doc){ 
			let metadata : {[index:string]:string|string[]} = {};
			for(let m of doc.attributes)
				metadata[m.id] = m.value!;
			let docPart = {
				title: doc.title,
				documentDate: doc.documentDate.toMillis(),
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
	saveDocDate(date: DateTime){
		if(this.state.doc){
			this.state.doc.documentDate = date;
			this.save();
		}
	}
	saveTags(tags:string[]){
		if(this.state.doc){
			this.state.doc.tags = tags;
			this.save();
		}
	}
	saveAttribute(md: anyMetadata, i: number){
		if(this.state.doc){
			this.state.doc.attributes[i] = md;
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
	renderAttribute(md: anyMetadata, i:number){
		if(!md.isArray){
			return <tr key={md.id}>
				<td><b>{md.title+": "}</b></td>
				<td>
				<EditMetadata 
					md={md as any}
					onSave={(v:DateTime|number|string)=>{
						if(v instanceof DateTime){
							if(md.type == 'date' || md.type == 'datetime'){
								v = v.toMillis();
							}else{
								throw new Error(`Invalid type/value combination! type ${md.type} and DateTime object`);
							}
						}else{
							v = v.toString();
						}
						this.saveAttribute({...md, value: [v]}, i)}
					} />
				</td>
			</tr>;
		}
	}
	renderEditDocDate(doc: document){
		return <EditDateTimeInput  initValue={doc.documentDate} onSave={v=>this.saveDocDate(v)} />
	}
	renderEditTags(doc:document){
		console.log(this.id2tag, this.id2tag("test"));
		const tags2vals = (tags:tag[])=>tags.map(t=>({label:t.title,value:t.id}));
		const ids2vals = (ids:string[])=>ids.map(id=>({value:id,label:(this.id2tag(id) as tag).id}))
		const vals2tags = (vals:{label:string,value:string}[])=>vals.map(v=>({id:v.value,title:v.label}));
		const vals2ids = (vals:{label:string,value:string}[])=>vals.map(v=>v.value);
		return(<EditInput<string[]> 
			initValue={doc.tags}
			onSave={tags=>this.saveTags(tags)}
			renderDisplay={(ids: string[], edit: ()=>void)=>(
				<React.Fragment>
					{ids.map(id=>(<Tag key={id}>{(this.id2tag(id) as tag || {title: ""}).title}</Tag>))}
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
		let keywords = ([] as string[]).concat(...this.state.doc.files.map(f=>f.keywords));

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
					<Row>
						<Col md={17}>
							<table style={{overflow: "visible"}}><tbody>
								<tr>
									<td><b>{intl.get("title")}: </b></td>
									<td>{this.renderEditTitle(doc)}</td>
								</tr><tr>
									<td><b>{intl.get("files")}: </b></td>
									<td>
										{doc.files.map(f=>(<span key={f.uuid+"/download"} style={{marginRight: "10px"}}>
											<a href={"/api/files/"+f.uuid}>
												{f.origFilename}
											</a>
											{ f.isTextFile != false ? (<React.Fragment>&nbsp;(<a href={"/api/files/"+f.uuid+"/ocr"}>OCR</a>)</React.Fragment>) : null }
										</span>))}
									</td>
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
									<td><CollapseLongText text={keywords.join(", ")} maxLength={450} /></td>
								</tr><tr>
									<td><b>{intl.get("tags")}: </b></td>
									<td>{this.renderEditTags(doc)}</td>
								</tr>
							</tbody></table>
						</Col>
						<Col md={7}>
							{doc.files.map(f=><img style={{maxWidth: '100%'}} key={f.uuid} src={"/api/files/"+f.uuid+'/thumbnail'} />)}
						</Col>
					</Row>
					<Divider style={{marginTop: "15px"}} />
					<h2>{intl.get("menu_meta")}</h2>
					<table><tbody>
						{this.state.doc.attributes.map((md,i)=>this.renderAttribute(md,i))}
					</tbody></table>
				</Tabs.TabPane>
				{doc.files.map(f=><Tabs.TabPane key={f.uuid} tab={f.origFilename}>
					<FileViewer file={f} />
				</Tabs.TabPane>)}
			</Tabs>
		</div>);
	}
}

const FileViewer = ({file}: {file: document['files'][0]}) => {
	const url = "/api/files/"+file.uuid+"/embed";
	switch(file.origFilename.match(/\.(\w+)$/)[1]){
		case "pdf":
			return <object type="application/pdf" style={{width: '100%', minHeight: '70vh'}} data={url} />
		case "png": 
		case "jpg":
			return <img src={url} alt={file.origFilename} />
		case "txt":
		case "md": //TODO add markdown view
			return <iframe src={url} />
		case "docx": 
		case "xlsx":
		case "odt": 
		case "ods":
			return <span>{intl.get("viewing_not_possible_yet")}</span>
		default:
			return <span>Unknown file type {f.origFilename}</span>
	}
}
