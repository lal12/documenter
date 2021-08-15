import {httpRequest} from "./api";
import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import List from "antd/lib/list";
import Input from "antd/lib/input";
import Divider from "antd/lib/divider";
import Select from "antd/lib/select";
import Checkbox from "antd/lib/checkbox";
import { intl } from "./intl";

type meta = {
	id: string, 
	title: string, 
	isArray: boolean, 
	optional: boolean,
	deleteable: boolean, 
	type: string
};
export default class MetaView extends React.Component{
	state: {metas: meta[], title: string, 
		isArray: boolean, type: string, optional: boolean};
	constructor(props: any){
		super(props);
		this.state = {metas: [], title: "", isArray: false, 
			type: "string", optional: false};
		this.refresh();
	}
	refresh(){
		httpRequest("GET", "/api/metas")
		.then((d:any)=>this.setState({metas: d}));
	}
	async addMeta(){
		let title = this.state.title;
		if(title.length){
			httpRequest("POST", "/api/metas", {
				title, 
				type: this.state.type,
				isArray: this.state.isArray,
				optional: this.state.optional
			}).then(d=>this.refresh())
			this.setState({title: "", isArray: false, type: "string"})
		}
	}
	delMeta(t: meta){
		if(confirm(intl.get("meta_confirm_del", t))){
			httpRequest("DELETE", "/api/metas/"+t.id)
			.then(()=>this.refresh());
		}
	}
	renderItem(t: meta){
		let actions = [];
		if(t.deleteable){
			actions.push(<Button type="danger" onClick={()=>this.delMeta(t)}>
				<Icon type="delete"/>
			</Button>)
		}
		return (<List.Item actions={actions}>
			<List.Item.Meta
				title={t.title}
				description={
					t.type+
					(t.isArray ? "[]" : "")+
					(t.optional ? " (optional)" : "")
				}
			/>
		</List.Item>);
	}
	render(){
		return (<div style={{
			backgroundColor: "white",
			margin: "2vw",
			padding: "1vw"
		}}>
			<h1>{intl.get("menu_meta")}</h1>
			<Divider />
			<div style={{marginBottom: "10px"}}>
				<Input placeholder="Name" value={this.state.title}
					style={{width:250, marginRight: 10}}
					onChange={e=>this.setState({title: e.target.value})}
					minLength={5}
				/>
				<Select value={this.state.type}
					onChange={(v: any)=>this.setState({type: v})}
					style={{marginRight: 10}}
				>
					<Select.Option value="string">string</Select.Option>
					<Select.Option value="date">date</Select.Option>
					<Select.Option value="uint">uint</Select.Option>
					<Select.Option value="int">int</Select.Option>
					<Select.Option value="decimal">decimal</Select.Option>
				</Select>
				<Checkbox checked={this.state.isArray}
					onChange={e=>this.setState({isArray: e.target.checked})}
					style={{marginRight: 10}}
				>
					{intl.get("array")}
				</Checkbox>
				<Checkbox checked={this.state.optional}
					onChange={e=>this.setState({optional: e.target.checked})}
					style={{marginRight: 10}}
				>
					{intl.get("optional")}
				</Checkbox>
				<Button type="primary" disabled={this.state.title.length < 5}
					onClick={()=>this.addMeta()}
					style={{marginRight: 10}} 
				>{intl.get("add")}</Button>
			</div>
			<List 
				renderItem={(t: any)=>this.renderItem(t)}
				dataSource={this.state.metas}
				bordered={true} size="small"
			/>
		</div>);
	}
}