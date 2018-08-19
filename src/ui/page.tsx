import Layout from "antd/lib/layout";
import Menu from "antd/lib/menu";
import {render} from "react-dom";
import * as React from "react";
import {BrowserRouter, Route, NavLink, Link, withRouter} from "react-router-dom";

import MetaView from "./meta-view";
import TagView from "./tag-view";
import DocsView from "./docs-view";
import DocEditView from "./doc-edit-view";

class AppMenu extends React.Component<{location: any}>{
	render(){
		return(
			<Menu mode="horizontal" selectedKeys={[this.props.location.pathname]} >
				<Menu.Item key="/ui/docs">
					<NavLink to="/ui/docs">
						Dokumente
					</NavLink>
				</Menu.Item>
				<Menu.Item key="/ui/tags">
					<NavLink to="/ui/tags">
						Tags
					</NavLink>
				</Menu.Item>
				<Menu.Item key="/ui/meta">
					<NavLink to="/ui/meta">
						Attribute
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
					<Route path="/ui/tags" exact component={TagView} />
					<Route path="/ui/meta" exact component={MetaView} />
				</Layout.Content>
				<Layout.Footer></Layout.Footer>
			</Layout></BrowserRouter>
		);
	}
}

document.onreadystatechange = ()=>render(<App />, document.getElementById("root"));