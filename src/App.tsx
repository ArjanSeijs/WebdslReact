import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import React from 'react';
import {BrowserRouter as Router, Redirect, Route, Switch,} from "react-router-dom";
import {observer} from "mobx-react";

import {MyNavbar} from "./pages/navbar";
import {Root} from "./pages/root";
import {AuthenticationState} from "./pages/authencation";
import {PageNotFound} from "./pages/pageNotFound";
import {Search} from "./pages/search";
import {FamilyOverview} from "./pages/familyOverview";
import {PersonOverview} from "./pages/personOverview";
import {PersonEdit} from "./pages/personEdit";

const App = observer(function (x: { auth: AuthenticationState }): JSX.Element {
    return (
        <Router>
            <MyNavbar/>
            <Switch>
                <Route path="/search/:query" render={({match: {params}}) => <Search query={params.query}/>}/>
                <Route path="/family_overview/:uuid" render={({match: {params}}) => <FamilyOverview uuid={params.uuid}/>}/>
                <Route path="/person_overview/:uuid" render={({match: {params}}) => <PersonOverview uuid={params.uuid}/>}/>
                <Route path="/person_edit/:uuid" render={({match: {params}}) => <PersonEdit uuid={params.uuid}/>}/>
                <Route exact={true} path="/"> <Root/> </Route>
                <Route path="/404"> <PageNotFound/> </Route>
                <Route> <Redirect to="/404"/> </Route>
            </Switch>
        </Router>
    );
});

export default App;
