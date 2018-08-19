import {httpRequest} from "./api";
import * as React from "react";
import Button from "antd/lib/button";
import Icon from "antd/lib/icon";

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

export default class DocEditView extends React.Component<{uuid: string}>{
    state: {doc: document|null};
    constructor(props: {uuid: string}){
        super(props);
        this.state = {doc: null};
    }
    componentWillMount(){
        httpRequest("GET", "/api/docs/"+this.props.uuid)
            .then(d=>{
                d = {
                    ...d, 
                    added: new Date(d.added),
                    modified: new Date(d.modified),
                    documentDate: new Date(d.documentDate)
                };
                this.setState({doc: d})
            })
    }
    render(){
        if(this.state.doc == null)
            return null;
        let doc = this.state.doc as document;
        return(<div style={{
			backgroundColor: "white",
			margin: "2vw",
			padding: "1vw"
		}}>
			<div>
                <h1 style={{display: "inline-block"}}>
                    Dokument: {doc.title}
                </h1>
                <a href={"/api/docs/"+doc.uuid+"/file"} style={{marginLeft: "10px"}}>
                    <Button>
                        <Icon type="download"/>
                    </Button>
                </a>
                <Button type="danger" style={{marginLeft: "10px"}}
                    onClick={()=>{
                        if(confirm("Wirklich das Dokument '"+doc.title+"' löschen?")){
                            httpRequest("DELETE", "/api/docs/"+doc.uuid).then(()=>{
                                window.location.href = "/ui/docs";
                            })
                        }
                    }}
                >
                    <Icon type="delete"/>
                </Button>
            </div>
        </div>);
    }
}