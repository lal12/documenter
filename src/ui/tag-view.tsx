import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import List from "antd/lib/list";
import Input from "antd/lib/input";
import Divider from "antd/lib/divider";
import {httpRequest} from "./api";
import { intl } from "../lang/intl";

export default class TagsView extends React.Component{
	state: {tags: ({id: string, title: string})[], name: string};
	constructor(props: any){
		super(props);
		this.state = {tags: [], name: ""};
	}
	componentWillMount(){
		this.refresh();
	}
	refresh(){
		httpRequest("GET", "/api/tags")
		.then((d:any)=>this.setState({tags: d}));
	}
	async addTag(v: string){
		let title = v;
		if(title.length > 0){
			httpRequest("POST", "/api/tags", {
				title, id: title.toLowerCase().replace(/[^0-9a-z]/, "")
			}).then(d=>this.refresh())
			this.setState({name: ""});
		}
	}
	delTag(t: any){
		if(confirm("Wirklich das Tag '"+t.title+"' löschen?")){
			httpRequest("DELETE", "/api/tags/"+t.id)
			.then(()=>this.refresh());
		}
	}
	renderItem(t: {id: string, title: string}){
		let actions = [
			(<Button type="default" >
				<Icon type="search"/>
			</Button>),
			(<Button type="danger" onClick={()=>this.delTag(t)}>
				<Icon type="delete"/>
			</Button>)
		];
		return (<List.Item actions={actions}>{t.title}</List.Item>);
	}
	render(){
		return (<div style={{
			backgroundColor: "white",
			margin: "2vw",
			padding: "1vw"
		}}>
			<h1>{intl.get("menu_tags")}</h1>
			<Divider />
			<div style={{marginBottom: "10px"}}>
				<Input.Search placeholder={intl.get("name")}
					onChange={(e)=>this.setState({name: e.target.value})}
					value={this.state.name}
					onSearch={(v:string)=>this.addTag(v)} 
					enterButton="+" />
			</div>
			<List 
				renderItem={(t: any)=>this.renderItem(t)}
				dataSource={this.state.tags}
				bordered={true} size="small"
			/>
		</div>);
	}
}