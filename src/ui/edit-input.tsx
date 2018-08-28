import * as React from "react";
import Input from "antd/lib/input";
import Button from "antd/lib/button";
import DateTime from "react-datetime";
import Date from "react-datetime";
import Icon from "antd/lib/icon";
import { Moment } from "moment";

abstract class AbstractEditInput<T,P={}> extends React.Component<P & {
	initValue?: T,
	value?: T,
	onChange?: (val:T)=>void,
	onAbort?: ()=>void,
	onSave?: (v:T)=>void,
    onEditStart?: ()=>void
}>{
    state: {value: T, edit: boolean, beforeEdit: string};
	constructor(props: any){
		super(props);
		let value = props.initValue ? props.initValue : props.value ? props.value : "";
		this.state = {value, edit: false, beforeEdit: ""};
    }
    componentWillReceiveProps(newProps:any){

        if(!this.state.edit && this.props.value != newProps.initValue)
            this.setState({value: newProps.initValue})
    }
	save(){
		this.setState({edit: false});
		if(this.props.onSave)
			this.props.onSave(this.state.value);
	}
	abort(){
		this.setState({edit: false, value: this.state.beforeEdit});
		if(this.props.onAbort)
			this.props.onAbort();
	}
	edit(){
		this.setState({edit: true, beforeEdit: this.state.value});
		if(this.props.onEditStart)
			this.props.onEditStart();
	}
	change(val: T){
		if(!this.props.value)
			this.setState({value: val})
		if(this.props.onChange)
			this.props.onChange(val);
    }
    abstract renderEdit(): JSX.Element;
    abstract renderDisplay(): JSX.Element;
	render(){
		if(this.state.edit){
            return this.renderEdit();
		}else{
			return this.renderDisplay();
		}
	}
}


export class EditInput<T> extends AbstractEditInput<T,{
	renderEdit: (value: T, onSave: ()=>void, onAbort: ()=>void, onChange:(val:T)=>void)=>JSX.Element,
	renderDisplay: (value: T, onEdit: ()=>void)=>JSX.Element,
}>{
    renderEdit(){
        return this.props.renderEdit(
            this.state.value, this.save.bind(this), 
            this.abort.bind(this), this.change.bind(this));
    }
    renderDisplay(){
        return this.props.renderDisplay(
            this.state.value, this.edit.bind(this));
    }
}

export class EditTextInput extends AbstractEditInput<string,{type: string, label:string}>{
    renderEdit(){
        return (<Input.Group compact style={{display: "table"}}>
            <Input 
                style={{display: "table-cell", width: "auto"}}
                type={this.props.type}
                value={this.state.value} 
                placeholder="Titel" 
                addonBefore="Titel"
                onChange={(e)=>this.change(e.target.value)}
            />
            <Button onClick={()=>this.save()}  
                style={{display: "table-cell"}}
                type="primary" 
            >
                <Icon type="save" />
            </Button>
            <Button onClick={()=>this.abort()} 
                style={{display: "table-cell"}}
                type="danger" 
            >
                <Icon type="close" />
            </Button>
        </Input.Group>);
    }
    renderDisplay(){
        return (<div>
            {this.props.label+": "}
            {this.state.value}
            <Button type="primary" size="small" 
				style={{marginLeft: "10px"}}
				onClick={()=>this.edit()}>
				<Icon type="edit"/>
			</Button>
        </div>);
    }
}

export class EditNumberInput extends AbstractEditInput<number, {
    min?: number,
    max?: number,
    step?: number,
    label?: string
}>{
    renderEdit(){
        return (<Input.Group compact style={{display: "table"}}>
            <Input 
                style={{display: "table-cell", width: "auto"}}
                type="number"
                value={this.state.value}
                placeholder={this.props.label} 
                addonBefore={this.props.label}
                onChange={(e)=>
                    this.change(parseFloat(e.target.value))
                }
            />
            <Button onClick={()=>this.save()}  
                style={{display: "table-cell"}}
                type="primary" 
            >
                <Icon type="save" />
            </Button>
            <Button onClick={()=>this.abort()} 
                style={{display: "table-cell"}}
                type="danger" 
            >
                <Icon type="close" />
            </Button>
        </Input.Group>);
    }
    renderDisplay(){
        return (<div>
            {this.props.label+": "}
            {this.state.value}
            <Button type="primary" size="small" 
				style={{marginLeft: "10px"}}
				onClick={()=>this.edit()}>
				<Icon type="edit"/>
			</Button>
        </div>);
    }
}

export class EditDateTimeInput extends AbstractEditInput<Moment, {}>{
    renderEdit(){
        return (<Input.Group compact style={{display: "table"}}>
            <DateTime 
                value={this.state.value}
                onChange={(e)=>this.change(e as Moment)}
            />
            <Button onClick={()=>this.save()}  
                style={{display: "table-cell"}}
                type="primary" 
            >
                <Icon type="save" />
            </Button>
            <Button onClick={()=>this.abort()} 
                style={{display: "table-cell"}}
                type="danger" 
            >
                <Icon type="close" />
            </Button>
        </Input.Group>);
    }
    renderDisplay(){
        return (<div>
            {this.state.value.format("DD.MM.YYYY")}
            <Button type="primary" size="small" 
				style={{marginLeft: "10px"}}
				onClick={()=>this.edit()}>
				<Icon type="edit"/>
			</Button>
        </div>);
    }
}

export class EditDateInput extends AbstractEditInput<Moment, {}>{
    renderEdit(){
        return (<Input.Group compact style={{display: "table"}}>
            <Date
                value={this.state.value}
                onChange={(e)=>this.change(e as Moment)}
                locale="de"
            />
            <Button onClick={()=>this.save()}  
                style={{display: "table-cell"}}
                type="primary" 
            >
                <Icon type="save" />
            </Button>
            <Button onClick={()=>this.abort()} 
                style={{display: "table-cell"}}
                type="danger" 
            >
                <Icon type="close" />
            </Button>
        </Input.Group>);
    }
    renderDisplay(){
        return (<div>
            {this.state.value.format("DD.MM.YYYY hh:mm:ss")}
            <Button type="primary" size="small" 
				style={{marginLeft: "10px"}}
				onClick={()=>this.edit()}>
				<Icon type="edit"/>
			</Button>
        </div>);
    }
}
