import {httpRequest, GraphQLQuery, useGQL} from "./api";
import * as React from "react";
import Table from "antd/lib/table";
import Tag from "antd/lib/tag";
import Column from "antd/lib/table/Column";
import Button from "antd/lib/button";
import Input from "antd/lib/input";
import Icon from "antd/lib/icon";
import {Link, useHistory} from "react-router-dom";
import {intl} from "./intl";
import Divider from "antd/lib/divider";
import Select from "antd/lib/select";
import Search from "antd/lib/input/Search";
import { DateTime } from "luxon";

import {StringParam, useQueryParam, ArrayParam} from 'use-query-params';
import { Col, Row } from "antd";

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

const DocsView = (props: DocsProps)=>{
	const history = useHistory();
	const [searchTags, setSearchTags] = useQueryParam<string[]>('tags', ArrayParam);
	const [search, setSearch] = useQueryParam<string|null>('search', StringParam);
	const [{documents: docs}, loadDocs] = useGQL<{documents: document[]}>(`query($search: String, $tags: [String!]){
		documents(search: $search, tags: $tags){
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
	}`, {search: search, tags: searchTags}, undefined, {documents: []});
	const [{tags}, reloadTags] = useGQL<{tags: tag[]}>(`
		query{
			tags{
				id
				title
			}
		}
	`, {}, undefined, {tags: []});
	const finputRef = React.useRef<Input>(null);

	function addDoc(){
		let finp = finputRef.current.input;
		if(finp.click){
			finp.click();
		}else{
			let evt = document.createEvent("MouseEvents");
			evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
			finp.dispatchEvent(evt);
		}
	}

	function onFileUpload(e: React.ChangeEvent<HTMLInputElement>){
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
				history.push("/ui/docs/"+d.uuid)
			})
		}
	}

	return <div className="content">
		<Row>
			<Col md={3}>
				<h1 style={{display: "inline-block"}}>
					{intl.get("menu_doc")}
				</h1>
			</Col>
			<Col md={9}>
				<Search
					size="large"
					placeholder={intl.get("search_input")}
					onSearch={value =>{
						setSearch(value.length ? value : null);
					}}
					defaultValue={search}
					style={{ marginLeft: 50, width: "300px" }}
				/>
			</Col>
			<Col md={7}>
				<Select size="large" placeholder={intl.get("filter_tags")} 
					mode="tags" allowClear defaultValue={searchTags||[]} onChange={e=>{console.log(e);setSearchTags(e)}}
					style={{ width: '100%', alignSelf: 'left', justifySelf: 'left' }}
				>
					{tags.map(t=><Select.Option key={t.id} value={t.id}>{t.title}</Select.Option>)}
				</Select>
			</Col>
			<Col md={5}>
				<Input type="file" hidden={true}
					ref={finputRef} onChange={e=>onFileUpload(e)} />
				<Button type="primary" size="large" onClick={()=>addDoc()}>
					{intl.get("doc_upload")}
				</Button>
			</Col>
		</Row>
		
		<Divider />
		
		<Table dataSource={docs} rowKey={d=>d.uuid}>
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
								.then(()=>loadDocs())
						}
					}}><Icon type="delete"/></Button>
				</React.Fragment>);
			}} dataIndex="uuid" />
		</Table>
	</div>;
}

export default DocsView;
