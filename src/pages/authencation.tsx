import React from "react";
import {Button, Card, Form, FormControl, InputGroup} from "react-bootstrap";
import {makeAutoObservable} from "mobx";
import {typeHistory, typeHistoryProps} from "../App";

type authProps = { title: string };
type authState = { username: string, password: string }

/**
 * State that stores the current username if logged in, or an empty string if not logged in.
 * The state is updated with {@link AuthenticationState#update} by checking the server if the current session is still valid.
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
     * @param history?
     */
    logout(redirect = false, history?: typeHistory) {
        this.username = '';
        if (redirect && window.location.pathname !== '/' && window.location.pathname) {
            if (history) history.push('/')
            else window.location.pathname = '/'
        }
    }

    /**
     * Checks if the user is logged in by checking the current state.
     * This does not ask the server if it is correct, {@link update} will validate it with the server.
     */
    isLoggedIn() {
        return !!this.username;
    }

    /**
     * Update the value of this.username by connecting to the server and seeing if the current session is still
     * valid.
     */
    async update() {
        let url = '/FamilyTree/user_name';
        let response = await fetch(url)
        if (!response.ok) throw new FetchError(response.statusText, url)

        let json = await response.json();
        if (json.status === 'loggedin') {
            this.login(json.username);
        } else {
            this.logout();
        }
    }
}

/**
 * React Component that holds a card with a form for registering and logging in.
 * The states keep track of the input fields.
 */
abstract class AuthComponent extends React.Component<authProps, authState> {

    protected constructor(props: authProps) {
        super(props);
        this.state = {username: '', password: ''};
    }

    /**
     * Called when the form is submitted.
     * @param e
     */
    abstract handleSubmit(e: React.FormEvent<HTMLFormElement>): void;

    /**
     * Update fields
     * @param event
     */
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
                    {this.renderForm()}
                </Card.Body>
            </Card>
        )
    }

    private renderForm() {
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
export class LogoutComponent extends React.Component<typeHistoryProps> {

    render(): JSX.Element {
        return <li className="nav-item nav-link" onClick={(e) => (this.handleSubmit())}>
            <i className="fa fa-user-lock"/> Logout
        </li>
    }

    handleSubmit(): void {
        logout().then(() => AuthenticationState.instance.logout(true, this.props.history)).catch(rejected);
    }

}

/**
 * Register the user with the username and password,
 * @throws Error if request failed
 * @param username
 * @param password
 */
async function register(username: string, password: string): Promise<string> {
    let url = '/FamilyTree/user_register';
    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({username, password})
    })
    if (!response.ok) throw new FetchError(response.statusText, url)
    let json = await response.json();
    alert(json.message)
    return username;

}

/**
 * Login user
 * @throws Error if request failed
 * @param username
 * @param password
 * @return the username of if succeeded.
 */
async function login(username: string, password: string): Promise<string> {
    let url = '/FamilyTree/user_login';
    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify({username, password})
    })

    if (!response.ok) throw new FetchError(response.statusText, url)

    let json = await response.json();
    if (json.status !== 'success') throw new FetchError(json.message, url);
    alert(json.message)
    return json.username;
}

/**
 * Log the user out
 * @throws Error if request failed
 */
async function logout(): Promise<void> {
    let url = '/FamilyTree/user_logout';
    let response = await fetch(url, {redirect: "manual"})
    if (!response.ok) throw new FetchError(response.statusText, url)

    let json = await response.json();
    if (json.status !== 'success') throw new FetchError(json.message, url);
    alert('Logged out!')
}

/**
 * Exception handling method for requests,
 * display popup depending on the error and log the error to console
 * @param e
 */
export function rejected(e: Error) {
    if (e instanceof FetchError) {
        console.error('Exception at ' + e.source)
    }
    console.error(e)
    if (e.message === "NetworkError when attempting to fetch resource.") {
        alert('Access denied, invalid permissions')
    } else if (e.message === "Internal Server Error") {
        alert('Could not reach server')
    } else {
        alert(e.message);
    }
}

export class FetchError extends Error {
    source: string;

    constructor(message: string, source: string) {
        super(message);
        this.source = source;
    }
}