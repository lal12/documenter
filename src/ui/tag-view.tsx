import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";
import List from "antd/lib/list";
import Input from "antd/lib/input";
import Divider from "antd/lib/divider";
import {httpRequest, GraphQLQuery} from "./api";
import { intl } from "./intl";
import { Link } from "react-router-dom";
import { Col, Row, Tag } from "antd";

export default class TagsView extends React.Component{
	state: {tags: ({id: string, title: string, color: string})[], name: string, color: string};
	constructor(props: any){
		super(props);
		this.state = {tags: [], name: "", color: '#cccccc'};
	}
	componentWillMount(){
		this.refresh();
	}
	async refresh(){
		let d = await GraphQLQuery(`{
			tags{
        		id
        		title
				color
      		}
		}`);
		this.setState({tags:d.tags})
	}
	async addTag(v: string, color: string){
		let title = v;
		if(title.length > 0){
			httpRequest("POST", "/api/tags", {
				title, id: title.toLowerCase().replace(/[^0-9a-z]/, ""), color
			}).then(d=>this.refresh())
			this.setState({name: "", color: '#cccccc'});
		}
	}
	delTag(t: any){
		if(confirm("Wirklich das Tag '"+t.title+"' löschen?")){
			httpRequest("DELETE", "/api/tags/"+t.id)
			.then(()=>this.refresh());
		}
	}
	renderItem(t: {id: string, title: string, color: string}){
		let actions = [
			(<Link to={"/ui/docs/?tags="+t.id}><Button type="default" >
				<Icon type="search"/>
			</Button></Link>),
			(<Button type="danger" onClick={()=>this.delTag(t)}>
				<Icon type="delete"/>
			</Button>)
		];
		return (<List.Item actions={actions}><Tag color={'#'+t.color} style={{fontSize: '1.2em', height: '1.4em'}}>{t.title}</Tag></List.Item>);
	}
	render(){
		return (<div style={{
			backgroundColor: "white",
			margin: "2vw",
			padding: "1vw"
		}}>
			<h1>{intl.get("menu_tags")}</h1>
			<Divider />
			<Row>
				<Col sm={14}>
					<Input.Search placeholder={intl.get("name")}
						onChange={(e)=>this.setState({name: e.target.value})}
						value={this.state.name}
					/>
				</Col>
				<Col sm={5}>
					<Input type="color" value={this.state.color} onChange={e=>this.setState({color: e.target.value})} />
				</Col>
				<Col sm={5}>
					<Button style={{width: '100%'}} disabled={this.state.name.length == 0} type="primary" 
						onClick={()=>this.addTag(this.state.name, this.state.color.substr(1).toUpperCase())}
					>
						{intl.get('create_tag')}
					</Button>
				</Col>
			</Row>
			<List 
				renderItem={(t: any)=>this.renderItem(t)}
				dataSource={this.state.tags}
				bordered={true} size="small"
			/>
		</div>);
	}
}