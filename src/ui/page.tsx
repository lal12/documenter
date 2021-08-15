import Layout from "antd/lib/layout";
import Menu from "antd/lib/menu";
import {render} from "react-dom";
import * as React from "react";
import {BrowserRouter, Route, NavLink, withRouter, useLocation} from "react-router-dom";
import { QueryParamProvider } from 'use-query-params';

import MetaView from "./meta-view";
import TagView from "./tag-view";
import DocsView from "./docs-view";
import DocEditView from "./doc-edit-view";
import InboxView from "./inbox-view";

import Intl,{intl} from "./intl";
import { httpRequest } from "./api";

const intlCreatePromise = Intl.create(()=>{
	return httpRequest("GET", "/ui/lang.json")
		.then(d=>(d));
});


const AppMenu = ()=>{
	const location = useLocation();
	return <Menu mode="horizontal" selectedKeys={[location.pathname]} >
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
	</Menu>;
}

const App = ()=>{
	return <BrowserRouter><QueryParamProvider ReactRouterRoute={Route}><Layout>
		<Layout.Header>
			<AppMenu />
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
	</Layout></QueryParamProvider></BrowserRouter>;
}

Promise.all([
	new Promise<void>((res,rej)=>{document.onreadystatechange = ()=>res()}),
	intlCreatePromise
]).then(()=>{
	render(<App />, document.getElementById("root"));
});
