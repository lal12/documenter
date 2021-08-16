import {httpRequest, GraphQLQuery, useGQL} from "./api";
import * as React from "react";
import Card from "antd/lib/card"
import Checkbox from "antd/lib/checkbox";
import Button from "antd/lib/button";
import {intl} from "./intl";
import { useHistory } from "react-router-dom";


type InboxProps = {match: any, location: any, history: any};

const InboxView = (props: InboxProps)=>{
    const history = useHistory();
    const [{inbox: files}, loadFiles] = useGQL<{inbox: Array<{uuid: string, origFilename: string}>}>(`{
        inbox{
            uuid
            origFilename
        }
    }`, {}, undefined, {inbox: []});
    const [checked, setChecked2] = React.useState<string[]>([]);
    

    function setChecked(uuids: string[]){
        setChecked2(Array.from(new Set(uuids)));
    }

    function createDoc(){
        httpRequest("POST", "/api/docs/inbox", checked)
            .then(d=>history.push("/ui/docs/"+d.uuid))
    }

    function delFiles(){
        if(confirm("Wirklich die gewählten Dateien löschen?")){
            Promise.all(
                checked.map(uuid=>
                    httpRequest("DELETE", "/api/files/"+uuid)
                )
            ).then(()=>loadFiles())
        }
    }

    return <div className="content" >
        <h1 style={{display: "inline-block"}}>
            {intl.get("menu_inbox")}
        </h1>
        <div style={{float: "right"}}>
            <Button type="primary" size="large"
                disabled={checked.length == 0}
                onClick={()=>createDoc()} style={{marginRight: "10px"}}
            >
                {intl.get("inbox_create_doc")}
            </Button>
            <Button type="danger" size="large"
                disabled={checked.length == 0}
                onClick={()=>delFiles()}>
                {intl.get("delete")}
            </Button>
        </div>
        <div>
            {files.length == 0 ? intl.get("noentries") : ""}
            {files.map(f=>(
                <File key={f.uuid} filename={f.origFilename} 
                    thumbnail={"/api/files/"+f.uuid+"/thumbnail"} 
                    checked={checked.includes(f.uuid)}
                    onChange={(c)=>c ? setChecked([...checked, f.uuid]) : setChecked(checked.filter(uuid=>uuid != f.uuid))} />
            ))}
        </div>
    </div>;
}

export default InboxView;

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


