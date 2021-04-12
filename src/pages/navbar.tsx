import React from "react";
import {Link} from "react-router-dom";
import {Button, Form, Nav, Navbar, NavDropdown} from "react-bootstrap";
import {AuthenticationState, FetchError, LoginComponent, LogoutComponent, RegisterComponent, rejected} from "./authencation";
import {observer} from "mobx-react";

/** {@see TreeList}*/
type typeTreeListState = { trees: { name: string, uuid: string }[] }
/** {@see NavbarLink}*/
type typeNavbarLinkProps = { text: string, to: string }
/** {@see SearchBar}*/
type typeSearchBarState = { search: string };

/**
 * Navbar with authenthication models that changes depending on {@link AuthenticationState}
 */
@observer
export class MyNavbar extends React.Component {

    render() {
        let auth: JSX.Element;
        let loggedIn = AuthenticationState.instance.isLoggedIn();
        auth = MyNavbar.auth(loggedIn);
        return (
            <Navbar variant='dark' bg="dark" expand="lg">
                <Navbar.Brand href="/">Family Tree</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto mb-2 mb-lg-0">
                        <NavbarLink to="/" text="Home"/>
                        {loggedIn ? <TreeList/> : ''}
                    </Nav>
                    <Nav className="ml-auto">
                        {auth}
                    </Nav>
                    <SearchBar/>
                </Navbar.Collapse>
            </Navbar>
        )
    }

    private static auth(loggedIn: boolean) {
        if (loggedIn) {
            return <>
                <li className="nav-item nav-link"><i className="fa fa-user-lock"/> {AuthenticationState.instance.username} </li>
                <LogoutComponent/>
            </>
        }
        return <>
            <NavDropdown title={<><i className="fa fa-user-lock"/> Login</>} id="login-dropdown">
                <div className="navbar-dropdown-menu p-2"><LoginComponent title="Login"/></div>
            </NavDropdown>
            <NavDropdown title={<><i className="fa fa-user-plus"/> Register</>} id="register-dropdown">
                <div className="navbar-dropdown-menu p-2"><RegisterComponent title="Register"/></div>
            </NavDropdown>
        </>;
    }
}

/**
 * Link component
 */
class NavbarLink extends React.Component<typeNavbarLinkProps> {

    render() {
        return (
            <li className="nav-item">
                <Link className="nav-link" to={this.props.to}>{this.props.text}</Link>
            </li>
        )
    }
}


/**
 * Searchbar
 */
class SearchBar extends React.Component<{}, typeSearchBarState> {

    constructor(props: {}) {
        super(props);
        this.state = {search: ''}
    }

    submitForm(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        document.getElementById('search-link')?.click();
    }

    render() {
        return (
            <Form inline={true} onSubmit={(e) => this.submitForm(e)}>
                <Form.Control type="text" placeholder="Search" className="mr-sm-2" value={this.state.search}
                              onChange={(e) => this.setState({search: e.target.value})}/>
                <Link id='search-link' to={`/search/${encodeURI(this.state.search)}`}><Button variant="outline-success">Search</Button></Link>
            </Form>)
    }
}

/**
 * List with all user trees and creation of new family trees.
 */
class TreeList extends React.Component<{}, typeTreeListState> {

    constructor(props: {}) {
        super(props);
        this.state = {trees: []};
    }

    async componentDidMount() {
        let response = await fetch("/FamilyTree/user_families");
        if (response.ok) {
            let json = await response.json();
            this.setState({trees: json.trees});
        }
    }

    render() {
        return (
            <NavDropdown id='tree-list' title='Family Trees'>
                {this.state.trees.map(state => <NavDropdown.Item key={state.uuid} href={`/family_overview/${state.uuid}`}>{state.name}</NavDropdown.Item>)}
                <NavDropdown.Divider/>
                <NavDropdown.Item onClick={() => TreeList.createTree()}>+ Family Tree</NavDropdown.Item>
            </NavDropdown>)
    }

    private static createTree() {
        let name = prompt("Family Name: ", "My Family");
        if (name) {
            TreeList.newTree(name).catch(rejected);
        }
    }

    /**
     * Send request to server to create a new familytree.
     * @param name
     * @private
     */
    private static async newTree(name: string) {
        let url = '/FamilyTree/user_newFamily';
        let response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: name
        })
        if (!response.ok) throw new FetchError(response.statusText, url);
        let {uuid} = await response.json();
        window.location.pathname = `/family_overview/${uuid}`;
    }
}