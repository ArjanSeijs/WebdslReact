import React from "react";
import {Button, Card, Form, FormControl, InputGroup} from "react-bootstrap";
import {makeAutoObservable} from "mobx";

type authProps = { title: string };
type authState = { username: string, password: string }

/**
 * Username of the logged in user with methods to change these values
 */
export class AuthenticationState {
    static instance = new AuthenticationState();

    username: string = '';

    constructor() {
        makeAutoObservable(this);
    }

    login(username: string) {
        this.username = username;
    }

    logout() {
        this.username = '';
    }

    isLoggedIn() {
        return !!this.username;
    }

    /**
     * Update the value of this.username by connecting to the server.
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
            alert('Could not reach server');
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
                    <Form onSubmit={(e) => this.handleSubmit(e)}>
                        <Form.Label>
                            <InputGroup>
                                <InputGroup.Prepend>
                                    <InputGroup.Text><i className="fa fa-user"/> </InputGroup.Text>
                                </InputGroup.Prepend>
                                <FormControl id="inlineFormInputGroupUsername2" name="username"
                                             placeholder="Username"
                                             type="text"
                                             onChange={(e) => this.handleChange(e)}/>
                            </InputGroup>
                            <InputGroup>
                                <InputGroup.Prepend>
                                    <InputGroup.Text><i className="fa fa-lock"/> </InputGroup.Text>
                                </InputGroup.Prepend>
                                <FormControl id="inlineFormInputGroupUsername2" name="password"
                                             placeholder="Password"
                                             type="password" onChange={(e) => this.handleChange(e)}/>
                            </InputGroup>
                        </Form.Label>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </Card.Body>
            </Card>
        )
    }
}

export class LoginComponent extends AuthComponent {

    handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault();
        login(this.state.username, this.state.password).then((u) => AuthenticationState.instance.login(u)).catch(console.error);
    }

}

export class RegisterComponent extends AuthComponent {


    handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
        e.preventDefault()
        register(this.state.username, this.state.password).catch(console.error);
    }

}

export class LogoutComponent extends React.Component {

    render() {
        return <li className="nav-item nav-link" onClick={(e) => (this.handleSubmit())}>
            <i className="fa fa-user-lock"/> Logout
        </li>
    }

    handleSubmit(): void {
        logout().then(() => AuthenticationState.instance.logout()).catch(console.error);
    }

}

/**
 * Registers the user
 * @throws Error if response failed
 * @param username
 * @param password
 */
async function register(username: string, password: string): Promise<void> {
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
    } else {
        alert('Could not reach server');
        throw new Error(response.statusText)
    }

}

/**
 * Login user
 * @param username
 * @param password
 * @return the username of the loggedin user if succeeded.
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
        alert(json.message)
        if (json.status !== 'success') {
            throw new Error(json.message);
        }
        return json.username;
    } else {
        alert('Could not reach server');
        throw new Error(response.statusText)
    }
}

/**
 * Logout
 */
async function logout(): Promise<void> {
    let response = await fetch('/FamilyTree/user_logout',{redirect:"manual"})
    if (response.ok) {
        let json = await response.json();
        if (json.status !== 'success') {
            throw new Error(json.message);
        }
        alert('Logged out!')
    } else {
        alert('Could not reach server');
        throw new Error(response.statusText)
    }
}