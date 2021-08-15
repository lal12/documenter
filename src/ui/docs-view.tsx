import {httpRequest, GraphQLQuery} from "./api";
import * as React from "react";
import Table from "antd/lib/table";
import Tag from "antd/lib/tag";
import Column from "antd/lib/table/Column";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import Icon from "antd/lib/icon";
import Checkbox from "antd/lib/checkbox";
import {Link, withRouter} from "react-router-dom";
import {intl} from "./intl";
import Divider from "antd/lib/divider";
import Search from "antd/lib/input/Search";
import { DateTime } from "luxon";

type tag = {
	id: string,
	title: string
}

type document = {
	uuid: string,
	added: Date,
	modified: Date,
	documentDate: Date,
	title: string,
	tags: tag[],
	files: Array<{
		uuid: string
	}>
};

type DocsProps = {match: any, location: any, history: any};
class DocsView extends React.Component<DocsProps>{
	state: {docs: document[], tags: tag[], search: null|string};
	constructor(props: DocsProps){
		super(props);
		this.state = {docs: [], tags: [], search: null};
		this.refresh();
	}
	async refresh(){
		let data = await GraphQLQuery(`query($search: String){
			documents(search: $search){
				uuid
				added
				modified
				documentDate
				title
				tags{
					id
					title
				}
				files{
					uuid
				}
			}
		}`, {search: this.state.search});
		this.setState({docs: data.documents});
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
				<Search
					size="large"
					placeholder={intl.get("search_input")}
					onSearch={value =>{
						this.setState({search: value.length ? value : null},()=>this.refresh());
					}}
					style={{ marginLeft: 50, width: "300px" }}
				/>
			<div style={{display: "inline-block", float: "right"}} >
				
				<Input type="file" hidden={true}
					ref="fileinput" onChange={e=>this.onFileUpload(e)} />
				<Button type="primary" size="large" onClick={()=>this.addDoc()}>
					{intl.get("doc_upload")}
				</Button>
			</div>
			
			<Divider />
			
			<Table dataSource={this.state.docs}>
				<Column key="title" dataIndex="title" render={(uuid, doc: document)=>
					<React.Fragment>
						<img style={{height: 120}} src={"/api/files/"+doc.files[0].uuid+"/thumbnail"} />
						&nbsp;&nbsp;
						<span>{doc.title}</span>
					</React.Fragment>
				} />
				<Column key="tags" dataIndex="tags" render={tags=>tags.map((t:any)=>(
					<Tag key={t.id}>{t.title}</Tag>
				))} />
				<Column title={intl.get("created")} key="documentDate" dataIndex="documentDate"
					render={d=>intl.date(DateTime.fromMillis(d))} />
				<Column title={intl.get("added")} key="added" dataIndex="added" 
					render={d=>intl.date(DateTime.fromMillis(d))} />
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