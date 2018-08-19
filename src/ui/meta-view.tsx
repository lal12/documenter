import {httpRequest} from "./api";
import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import List from "antd/lib/list";
import Input from "antd/lib/input";
import Divider from "antd/lib/divider";
import Select from "antd/lib/select";
import Checkbox from "antd/lib/checkbox";

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
				id: title.toLowerCase().replace(/[^0-9a-z]/, ""),
				type: this.state.type,
				isArray: this.state.isArray
			}).then(d=>this.refresh())
			this.setState({title: "", isArray: false, type: "string"})
		}
	}
	delMeta(t: any){
		if(confirm("Wirklich das Attribut '"+t.title+"' und alle enthaltenen Daten löschen?")){
			httpRequest("DELETE", "/api/metas/"+t.id)
			.then(()=>this.refresh());
		}
	}
	renderItem(t: meta){
		let actions = [];
		if(t.deleteable){
			console.log(t)
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
			<h1>Attribute</h1>
			<Divider />
			<div style={{marginBottom: "10px"}}>
				<Input placeholder="Name" value={this.state.title}
					style={{width:250, marginRight: 10}}
					onChange={e=>this.setState({title: e.target.value})}
				/>
				<Select value={this.state.type}
					onChange={v=>this.setState({type: v})}
					style={{marginRight: 10}}
				>
					<Select.Option value="string">string</Select.Option>
					<Select.Option value="date">date</Select.Option>
					<Select.Option value="uint">uint</Select.Option>
					<Select.Option value="int">int</Select.Option>
					<Select.Option value="decimal">decimal</Select.Option>
				</Select>
				<Checkbox value={this.state.isArray}
					onChange={e=>this.setState({isArray: e.target.checked})}
					style={{marginRight: 10}}
				>
					Array
				</Checkbox>
				<Checkbox value={this.state.optional}
					onChange={e=>this.setState({optional: e.target.checked})}
					style={{marginRight: 10}}
				>
					Optional
				</Checkbox>
				<Button type="primary" disabled={this.state.title.length == 0}
					onClick={()=>this.addMeta()}
					style={{marginRight: 10}} 
				>Hinzufügen</Button>
			</div>
			<List 
				renderItem={(t: any)=>this.renderItem(t)}
				dataSource={this.state.metas}
				bordered={true} size="small"
			/>
		</div>);
	}
}