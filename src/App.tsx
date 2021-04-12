import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css'
import './App.css';

import React from 'react';
import {BrowserRouter as Router, Redirect, Route, Switch, useHistory, withRouter} from "react-router-dom";
import {History, LocationState} from "history"
import {observer} from "mobx-react";

import {MyNavbar} from "./pages/navbar";
import {Root} from "./pages/root";
import {AuthenticationState} from "./pages/authencation";
import {PageNotFound} from "./pages/pageNotFound";
import {Search} from "./pages/search";
import {FamilyOverview, typeFamilyOverviewProps} from "./pages/familyOverview";
import {PersonOverview} from "./pages/personOverview";
import {PersonEdit, typePersonCardEditProps} from "./pages/personEdit";
import {PersonFamilyTree} from "./pages/personFamilyTree";

export type typeHistory = History<LocationState>;
export type typeHistoryProps = { history: typeHistory };

const HPersonEdit = withRouterWrapped<typePersonCardEditProps>(PersonEdit)
const HMyNavbar = withRouterWrapped<typeHistoryProps>(MyNavbar)
const HFamilyOverview = withRouterWrapped<typeFamilyOverviewProps>(FamilyOverview)
const HPersonFamilyTree = withRouterWrapped<typeFamilyOverviewProps>(PersonFamilyTree)

const App = observer(function (x: { auth: AuthenticationState }): JSX.Element {
    let history: typeHistory = useHistory();
    return (
        <Router>
            <HMyNavbar history={history}/>
            <Switch>
                <Route path="/search/:query" render={({match: {params}}) => <Search query={params.query}/>}/>
                <Route path="/family_overview/:uuid" render={({match: {params}}) => <HFamilyOverview uuid={params.uuid} history={history}/>}/>
                <Route path="/person_overview/:uuid" render={({match: {params}}) => <PersonOverview uuid={params.uuid}/>}/>
                <Route path="/person_edit/:uuid" render={({match: {params}}) => <HPersonEdit uuid={params.uuid} history={history}/>}/>
                <Route path="/person_tree/:uuid" render={({match: {params}}) => <HPersonFamilyTree uuid={params.uuid} history={history}/>}/>
                <Route exact={true} path="/"> <Root/> </Route>
                <Route path="/404"> <PageNotFound/> </Route>
                <Route> <Redirect to="/404"/> </Route>
            </Switch>
        </Router>
    );
});

/**
 * Wrapping function to convert withRouter to correct type.
 * https://reactrouter.com/web/api/withRouter
 * @param comp
 */
function withRouterWrapped<T extends typeHistoryProps>(comp: typeof React.Component): React.FunctionComponent<T> {
    let Component = withRouter(comp);
    return Component as any;
}

export default App;
