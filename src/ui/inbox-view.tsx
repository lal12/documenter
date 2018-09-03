import {httpRequest, GraphQLQuery} from "./api";
import * as React from "react";
import Card from "antd/lib/card"
import Checkbox from "antd/lib/checkbox";
import Button from "antd/lib/button";
import { withRouter } from "react-router";
import {intl} from "./intl";


type InboxProps = {match: any, location: any, history: any};
class InboxView extends React.Component<InboxProps>{
    state: Readonly<{files: ({uuid: string, origFilename: string, checked: boolean})[]}>;
    constructor(props: InboxProps){
        super(props);
        this.state = {files: []};
    }
    async refresh(){
        let d = await GraphQLQuery(`{
			inbox{
                uuid
                origFilename
            }
        }`);
        this.setState({ files: d.inbox.map( (f:any)=>({...f,checked: false}) ) });
    }
    componentDidMount(){
        this.refresh();
    }
    createDoc(){
        let files = this.state.files.filter(f=>f.checked).map(f=>f.uuid);
        httpRequest("POST", "/api/docs/inbox", files)
            .then(d=>this.props.history.push("/ui/docs/"+d.uuid))
    }
    delFiles(){
        if(confirm("Wirklich die gewählten Dateien löschen?")){
            let files = this.state.files.filter(f=>f.checked).map(f=>f.uuid);
            Promise.all(
                files.map(uuid=>
                    httpRequest("DELETE", "/api/files/"+uuid)
                )
            ).then(()=>this.refresh())
        }
    }
    render(){
        return (<div className="content" >
            <h1 style={{display: "inline-block"}}>
                {intl.get("menu_inbox")}
            </h1>
            <div style={{float: "right"}}>
                <Button type="primary" size="large"
                    disabled={this.state.files.filter(f=>f.checked).length == 0}
                    onClick={()=>this.createDoc()} style={{marginRight: "10px"}}
                >
                    {intl.get("inbox_create_doc")}
                </Button>
                <Button type="danger" size="large"
                    disabled={this.state.files.filter(f=>f.checked).length == 0}
                    onClick={()=>this.delFiles()}>
                    {intl.get("delete")}
                </Button>
            </div>
            <div>
                {this.state.files.length == 0 ? intl.get("noentries") : ""}
                {this.state.files.map(f=>(
                    <File filename={f.origFilename} 
                        thumbnail={"/api/files/"+f.uuid+"/thumbnail"} 
                        checked={f.checked}
                        onChange={(c)=>{f.checked = c; this.setState({})}} />
                ))}
            </div>
        </div>);
    }
}

const InboxViewRouter = withRouter(InboxView);
export default InboxViewRouter;


type fileProps = {
    filename: string, 
    thumbnail: string, 
    checked?: boolean,
    onChange?:(checked: boolean)=>void
};
class File extends React.Component<
    fileProps,
    {checked: boolean}
>{
    constructor(props: fileProps){
        super(props);
        this.state = {
            checked: props.checked === undefined ? false : props.checked
        };
    }
    componentWillReceiveProps(newProps: fileProps){
        if(newProps.checked !== undefined){
            this.setState({checked: newProps.checked});
        }
    }
    click(){
        let newState = !this.state.checked;
        this.setState({checked: newState})
        if(this.props.onChange)
            this.props.onChange(newState);
    }
    render(){
        return (<Card hoverable 
            className={"file"+(this.state.checked ? " checked" : "")}
            onClick={()=>this.click()}
            cover={<React.Fragment>
                <img src={this.props.thumbnail} />
                <Checkbox checked={this.state.checked} />
            </React.Fragment>}
            style={{width: "17%", display: "inline-block", margin: "1.5%"}}
        >
            <Card.Meta 
                title={<span
                    style={{fontSize: "11px"}}
                >{this.props.filename}</span>}
            />
        </Card>);
    }
}


