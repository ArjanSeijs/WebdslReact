import 'bootstrap/dist/css/bootstrap.min.css';

import React from 'react';
import './App.css';
import {MyNavbar} from "./pages/navbar";
import {BrowserRouter as Router, Route, Switch,} from "react-router-dom";
import {Root} from "./pages/root";
import {AuthenticationState} from "./pages/authencation";
import {observer} from "mobx-react";
import {PageNotFound} from "./pages/pageNotFound";
import {Search} from "./pages/search";

const App = observer(function (x: { auth: AuthenticationState }) {
    return (
        <Router>
            <MyNavbar/>
            <Switch>
                <Route path="/search/:query" render={(props) => <Search query={props.match.params.query}/>}>
                </Route>
                <Route exact={true} path="/">
                    <Root/>
                </Route>
                <Route path="*">
                    <PageNotFound/>
                </Route>
            </Switch>
        </Router>
    );
});

export default App;
