import React from "react";
import {Button, Card, Form, FormControl, InputGroup} from "react-bootstrap";
import {makeAutoObservable} from "mobx";

type authProps = { title: string };
type authState = { username: string, password: string }

/**
 * Stores the username and uses a singleton that will be used by an observer to
 * update the application state.
 */
export class AuthenticationState {
    static instance = new AuthenticationState();

    username: string = '';

    private constructor() {
        makeAutoObservable(this);
    }

    /**
     * Update the state, does not handle the actual login on the server
     * @param username
     */
    login(username: string) {
        this.username = username;
    }

    /**
     * Update the state, does not handle the actual logout server
     * @param redirect - if true return to home page.
     */
    logout(redirect = false) {
        this.username = '';
        if (redirect && window.location.pathname !== '/' && window.location.pathname) {
            window.location.pathname = '/'
        }
    }

    /**
     * Checks if the user is logged in by checking the current state.
     * This does not ask the server if it is correct {@link update} for this.
     */
    isLoggedIn() {
        return !!this.username;
    }

    /**
     * Update the value of this.username by connecting to the server and seeing if the current session is still
     * valid.
     */
    async update() {
        let response = await fetch('/FamilyTree/user_name')
        if (response.ok) {
            let json = await response.json();
            if (json.status === 'loggedin') {
                this.login(json.username);
            } else {
                this.logout();
            }

        } else {
            throw new Error(response.statusText)
        }
    }
}

/**
 * React Component that holds a card with a form for registering and logging in.
 */
abstract class AuthComponent extends React.Component<authProps, authState> {

    protected constructor(props: authProps) {
        super(props);
        this.state = {username: '', password: ''};
    }

    abstract handleSubmit(e: React.FormEvent<HTMLFormElement>): void;

    handleChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const target = event.target;
        const value = target.value;
        const name = target.name;
        this.setState({[name]: value} as authState);
    }

    render() {
        return (
            <Card>
                <Card.Body>
                    <Card.Title>{this.props.title}</Card.Title>
                    {this.getForm()}
                </Card.Body>
            </Card>
        )
    }

    private getForm() {
        return (
            <Form onSubmit={(e) => this.handleSubmit(e)}>
                <Form.Label>
                    <InputGroup>
                        <InputGroup.Prepend> <InputGroup.Text><i className="fa fa-user"/> </InputGroup.Text> </InputGroup.Prepend>
                        <FormControl id="username" name="username" placeholder="Username" type="text" onChange={(e) => this.handleChange(e)}/>
                    </InputGroup>
                    <InputGroup>
                        <InputGroup.Prepend> <InputGroup.Text><i className="fa fa-lock"/> </InputGroup.Text> </InputGroup.Prepend>
                        <FormControl id="password" name="password" placeholder="Password" type="password" onChange={(e) => this.handleChange(e)}/>
                    </InputGroup>
                </Form.Label>
                <Button variant="primary" type="submit"> Submit </Button>
            </Form>);
    }
}

/**
 * Login Modal
 */
export class LoginComponent extends AuthComponent {

    handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        login(this.state.username, this.state.password).then((u) => AuthenticationState.instance.login(u)).catch(rejected);
    }

}

/**
 * Register Modal
 */
export class RegisterComponent extends AuthComponent {


    handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault()
        register(this.state.username, this.state.password).then((u) => AuthenticationState.instance.login(u)).catch(rejected);
    }

}

/**
 * Logout component
 */
export class LogoutComponent extends React.Component {

    render(): JSX.Element {
        return <li className="nav-item nav-link" onClick={(e) => (this.handleSubmit())}>
            <i className="fa fa-user-lock"/> Logout
        </li>
    }

    handleSubmit(): void {
        logout().then(() => AuthenticationState.instance.logout(true)).catch(rejected);
    }

}

/**
 * Registers the user
 * @throws Error if response failed
 * @param username
 * @param password
 */
async function register(username: string, password: string): Promise<string> {
    let response = await fetch('/FamilyTree/user_register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({username, password})
    })
    if (response.ok) {
        let json = await response.json();
        alert(json.message)
        return username;
    } else {
        throw new Error(response.statusText)
    }

}

/**
 * Login user
 * @param username
 * @param password
 * @return the username of if succeeded.
 */
async function login(username: string, password: string): Promise<string> {
    let response = await fetch('/FamilyTree/user_login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({username, password})
    })
    if (response.ok) {
        let json = await response.json();

        if (json.status !== 'success') {
            throw new Error(json.message);
        }
        alert(json.message)
        return json.username;
    }
    throw new Error(response.statusText)
}

/**
 * Logout
 */
async function logout(): Promise<void> {
    let response = await fetch('/FamilyTree/user_logout', {redirect: "manual"})
    if (response.ok) {
        let json = await response.json();
        if (json.status !== 'success') {
            throw new Error(json.message);
        }
        alert('Logged out!')
    } else {
        throw new Error(response.statusText)
    }
}

/**
 * Exception handling method for requests,
 * display popup depending on the error and log the error to console
 * @param e
 */
export function rejected(e: any) {
    if (e.message === "NetworkError when attempting to fetch resource.") {
        alert('Access denied, invalid permissions')
        window.location.pathname = '/'
    } else if (e.message === "Internal Server Error") {
        alert('Could not reach server')
    } else {
        alert(e.message);
    }

    console.error(e)
}