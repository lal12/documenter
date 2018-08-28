import {httpRequest} from "./api";
import * as React from "react";
import Table from "antd/lib/table";
import Tag from "antd/lib/tag";
import Column from "antd/lib/table/Column";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import Icon from "antd/lib/icon";
import Checkbox from "antd/lib/checkbox";
import {Link, withRouter} from "react-router-dom";
import {intl} from "../lang/intl";
import Divider from "antd/lib/divider";

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

type DocsProps = {match: any, location: any, history: any};
class DocsView extends React.Component<DocsProps>{
	state: {docs: document[], tags: tag[]};
	constructor(props: DocsProps){
		super(props);
		this.state = {docs: [], tags: []};
		this.refresh();
	}
	id2tag(id:string):tag|null{
		let index = this.state.tags.findIndex(t=>t.id == id);
		if(index > -1)
			return this.state.tags[index];
		return null;
	}
	refresh(){
		httpRequest("GET", "/api/tags").then(d=>{
			this.setState({tags: d});
			return httpRequest("GET", "/api/docs")
		}).then((data:any)=>{
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
			let files = e.target.files;
			let formData = new FormData();
			Array.from(files).forEach(f=>formData.append("files", f));
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
				xhr.open("POST", "/api/docs/upload", true);
				xhr.send(formData);
			}).then(d=>{
				this.props.history.push("/ui/docs/"+d.uuid)
			})
		}
	}
	render(){
		return(<div className="content">
			<h1 style={{display: "inline-block"}}>
				{intl.get("menu_doc")}
			</h1>
			<div style={{display: "inline-block", float: "right"}} >
				<Input type="file" hidden={true}
					ref="fileinput" onChange={e=>this.onFileUpload(e)} />
				<Checkbox checked={true} style={{marginLeft: "10px"}}>
					{intl.get("doc_upload_enable_ocr")}
				</Checkbox>
				<Button type="primary" size="large" onClick={()=>this.addDoc()}>
					{intl.get("doc_upload")}
				</Button>
			</div>
			
			<Divider />
			
			<Table dataSource={this.state.docs}>
				<Column title={intl.get("title")} key="title" dataIndex="title" />
				<Column key="tags" dataIndex="tags" render={tags=>tags.map((t:string)=>(
					<Tag key={t}>{(this.id2tag(t) as tag).title}</Tag>
				))} />
				<Column title={intl.get("created")} key="documentDate" dataIndex="documentDate"
					render={d=>intl.date(d)} />
				<Column title={intl.get("added")} key="added" dataIndex="added" 
					render={d=>intl.date(d)} />
				<Column render={(uuid,doc: document)=>{
					return (<React.Fragment>
						<Link to={"/ui/docs/"+uuid}>
							<Button><Icon type="edit"/></Button>
						</Link>
						<a href={"/api/docs/"+uuid+"/file"}>
							<Button><Icon type="download"/></Button>
						</a>
						<Button onClick={()=>{
							if(confirm(intl.get("doc_confirm_del", doc))){
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

const DocsViewRouter = withRouter(DocsView)
export default DocsViewRouter;