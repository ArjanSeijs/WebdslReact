import '../stylesheets/common_.css'
import '../stylesheets/style.css'
import logo from '../logo.svg';

import * as React from "react";
import { Container } from 'react-bootstrap';

export class Root extends React.Component<{}> {

    render() {
        return (
            <Container fluid className="body ml-auto">
                <div className="App">
                        <img src={logo} className="App-logo" alt="logo" />
                        <p>
                            Welcome!
                        </p>
                </div>
            </Container>
        )
    }
}