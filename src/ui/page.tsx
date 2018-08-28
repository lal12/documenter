import Layout from "antd/lib/layout";
import Menu from "antd/lib/menu";
import {render} from "react-dom";
import * as React from "react";
import {BrowserRouter, Route, NavLink, Link, withRouter} from "react-router-dom";

import MetaView from "./meta-view";
import TagView from "./tag-view";
import DocsView from "./docs-view";
import DocEditView from "./doc-edit-view";
import InboxView from "./inbox-view";

import Intl,{intl} from "../lang/intl";
import { httpRequest } from "./api";

const intlCreatePromise = Intl.create(()=>{
	return httpRequest("GET", "/ui/lang.json")
		.then(d=>(d));
});

class AppMenu extends React.Component<{location: any}>{
	render(){
		return(
			<Menu mode="horizontal" selectedKeys={[this.props.location.pathname]} >
				<Menu.Item key="/ui/docs">
					<NavLink to="/ui/docs">
						{intl.get("menu_doc")}
					</NavLink>
				</Menu.Item>
				<Menu.Item key="/ui/inbox">
					<NavLink to="/ui/inbox">
					{intl.get("menu_inbox")}
					</NavLink>
				</Menu.Item>
				<Menu.Item key="/ui/tags">
					<NavLink to="/ui/tags">
						{intl.get("menu_tags")}
					</NavLink>
				</Menu.Item>
				<Menu.Item key="/ui/meta">
					<NavLink to="/ui/meta">
						{intl.get("menu_meta")}
					</NavLink>
				</Menu.Item>
			</Menu>
		);
	}
}

class App extends React.Component{

	render(){
		const AppMenu2 = withRouter(AppMenu as any);
		return (
			<BrowserRouter><Layout>
				<Layout.Header>
					<AppMenu2 />
				</Layout.Header>
				<Layout.Content>
					<Route path="/ui/docs/:uuid" exact component={(ri:any)=>{
						return (<DocEditView uuid={ri.match.params.uuid as string} />);
					}} />
					<Route path="/ui/docs" exact component={DocsView} />
					<Route path="/ui/inbox" exact component={InboxView} />
					<Route path="/ui/tags" exact component={TagView} />
					<Route path="/ui/meta" exact component={MetaView} />
				</Layout.Content>
				<Layout.Footer></Layout.Footer>
			</Layout></BrowserRouter>
		);
	}
}

Promise.all([
	new Promise((res,rej)=>{document.onreadystatechange = ()=>res()}),
	intlCreatePromise
]).then(()=>{
	render(<App />, document.getElementById("root"));
});
