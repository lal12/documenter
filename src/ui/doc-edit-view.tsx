import {httpRequest, GraphQLQuery} from "./api";
import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import Tabs from "antd/lib/tabs";
import Input from "antd/lib/input";
import {EditInput, EditTextInput, EditNumberInput, EditDateInput, EditDateTimeInput} from "./edit-input"
import Tag from "antd/lib/tag";
import Select from "antd/lib/select";
import Divider from "antd/lib/divider";

import {intl} from "./intl";
import { DateTime } from "luxon";
import { registerLocale } from 'react-datepicker';
import { Col, Row } from "antd";

import de from 'date-fns/locale/de';
registerLocale('de', de)


type tag = {
	id: string,
	title: string,
	color: string
}

interface document{
	uuid: string,
	added: DateTime,
	modified: DateTime,
	documentDate: DateTime,
	title: string,
	tags: string[],
	files: {
		origFilename: string,
		uuid: string,
		keywords: string[],
		isTextFile: boolean|"?"
	}[]
};


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
				color
			}
			document(uuid:$uuid){
				uuid
				added
				modified
				documentDate
				title
				tags{
					id
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
			let docPart = {
				title: doc.title,
				documentDate: doc.documentDate.toMillis(),
				tags: doc.tags,
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
	renderEditDocDate(doc: document){
		return <EditDateTimeInput  initValue={doc.documentDate} onSave={v=>this.saveDocDate(v)} />
	}
	renderEditTags(doc:document){
		return(<EditInput<string[]> 
			initValue={doc.tags}
			onSave={tags=>this.saveTags(tags)}
			renderDisplay={(ids: string[], edit: ()=>void)=><React.Fragment>
				{ids.map(id=>{
					const t = this.id2tag(id) as tag || {title: '', color: 'CCCCCC'}
					return <Tag color={'#'+t.color} key={id}>{t.title}</Tag>
				})}
				<Button onClick={edit}
					style={{marginLeft: "6px"}}
					type="primary" size="small"
				>
					<Icon type="edit" />
				</Button>
			</React.Fragment>} 
			renderEdit={(ids:string[], save: ()=>void, abort: ()=>void, change:(v:string[])=>void)=>(
				<React.Fragment>
					<div style={{display: "inline-block"}}><Select mode="tags"
						allowClear defaultValue={ids}
						style={{width:200}}
						onChange={(a:any)=>change(a)}
					>
						{this.state.tags.map(t=><Select.Option key={t.id} value={t.id}>{t.title}</Select.Option>)}
					</Select></div>
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
	switch(file.origFilename.match(/\.(\w+)$/)![1]){
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
			return <span>Unknown file type {file.origFilename}</span>
	}
}
