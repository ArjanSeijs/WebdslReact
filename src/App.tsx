import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import React from 'react';
import {BrowserRouter as Router, Route, Switch,} from "react-router-dom";
import {observer} from "mobx-react";

import {MyNavbar} from "./pages/navbar";
import {Root} from "./pages/root";
import {AuthenticationState} from "./pages/authencation";
import {PageNotFound} from "./pages/pageNotFound";
import {Search} from "./pages/search";
import {FamilyOverview} from "./pages/familyOverview";
import {PersonOverview} from "./pages/personOverview";

const App = observer(function (x: { auth: AuthenticationState }) {
    return (
        <Router>
            <MyNavbar/>
            <Switch>
                <Route path="/search/:query" render={({match: {params}}) => <Search query={params.query}/>}/>
                <Route path="/family_overview/:id" render={({match: {params}}) => <FamilyOverview id={params.id}/>}/>
                <Route path="/person_overview/:id" render={({match: {params}}) => <PersonOverview id={params.id}/>}/>
                <Route exact={true} path="/"> <Root/> </Route>
                <Route path="*"> <PageNotFound/> </Route>
            </Switch>
        </Router>
    );
});

export default App;
