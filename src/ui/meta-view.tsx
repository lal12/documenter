import {httpRequest, useGQL} from "./api";
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
	required: boolean,
	deletable: boolean, 
	type: string
};

const MetaView = ()=>{
	const [{metas, tags}, reload] = useGQL(`query{metas{id, title, isArray, required, deletable, type},tags{title,id}}`, {}, undefined, {metas: [], tags: []});
	const [title, setTitle] = React.useState('');
	const [isArray, setIsArray] = React.useState(false);
	const [required, setRequired] = React.useState(false);
	const [type, setType] = React.useState('string');
	//const [forTag, setReqTag] = React.useState<string|null>(null);

	async function addMeta(){
		if(title.length){
			httpRequest("POST", "/api/metas", {
				title, 
				type: type,
				isArray: isArray,
				//forTag,
				required
			}).then(d=>reload())
			setTitle('');
			setIsArray(false);
			setType('string');
			//setReqTag(null);
		}
	}

	function delMeta(t: typeof tags[0]){
		if(confirm(intl.get("meta_confirm_del", t))){
			httpRequest("DELETE", "/api/metas/"+t.id)
			.then(()=>reload());
		}
	}

	return <div style={{
		backgroundColor: "white",
		margin: "2vw",
		padding: "1vw"
	}}>
		<h1>{intl.get("menu_meta")}</h1>
		<Divider />
		<div style={{marginBottom: "10px"}}>
			<Input placeholder="Name" value={title}
				style={{width:250, marginRight: 10}}
				onChange={e=>setTitle(e.target.value)}
				minLength={5}
			/>
			<Select value={type}
				onChange={(v: any)=>setType(v)}
				style={{marginRight: 10}}
			>
				<Select.Option value="string">string</Select.Option>
				<Select.Option value="date">date</Select.Option>
				<Select.Option value="uint">uint</Select.Option>
				<Select.Option value="int">int</Select.Option>
				<Select.Option value="decimal">decimal</Select.Option>
			</Select>
			<Checkbox checked={isArray}
				onChange={e=>setIsArray(e.target.checked)}
				style={{marginRight: 10}}
			>
				{intl.get("array")}
			</Checkbox>
			<Checkbox checked={required}
				onChange={e=>setRequired(e.target.checked)}
				style={{marginRight: 10}}
			>
				{intl.get("required")}
			</Checkbox>
			{/*<Select defaultValue={forTag}
				onChange={v=>setReqTag(v)}
				style={{marginRight: 10, width: 200}}
				placeholder={intl.get("meta_for_tags")}
			>
				<Select.Option value={null}>({intl.get('all')})</Select.Option>
				{tags.map(t=><Select.Option key={t.id} value={t.id}>{t.title}</Select.Option>)}
			</Select>*/}
			<Button type="primary" disabled={title.length < 5}
				onClick={()=>addMeta()}
				style={{marginRight: 10}} 
			>{intl.get("add")}</Button>
		</div>
		<List 
			renderItem={t=>{
				let actions = [];
				if(t.deletable){
					actions.push(<Button type="danger" onClick={()=>delMeta(t)}>
						<Icon type="delete"/>
					</Button>)
				}
				return <List.Item actions={actions}>
					<List.Item.Meta
						title={t.title}
						description={
							t.type+
							(t.isArray ? "[]" : "")+
							(t.required ? " (optional)" : " (required)")
						}
						children={t.forTag ? tags.find(t.forTag)!.title : ''}
					/>
				</List.Item>;
			}}
			dataSource={metas}
			bordered={true} size="small"
		/>
	</div>;
}

export default MetaView;
