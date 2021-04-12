import '../stylesheets/d3tree.css'

import React from "react";
import {makeTree} from "./script/tree";
import {FetchError, rejected} from "./authencation";
import {typePersonOverviewProps} from "./personOverview";
import {typeHistoryProps} from "../App";

/** {@see PersonFamilyTree} */
export type typePersonFamilyTreeProps = typePersonOverviewProps & typeHistoryProps;
/** {@see PersonFamilyTree} */
export type typePersonFamilyTreeState = { json: any };

export class PersonFamilyTree extends React.Component<typePersonFamilyTreeProps, typePersonFamilyTreeState> {


    render() {
        if (!this.state) return <>Loading...</>
        return <div className="container-fluid w-100 h-100 m-3 overflow-hidden">
            <div id="tree"/>
        </div>
    }

    componentDidMount() {
        this.fetchData().then(({json}) => {
            this.setState({json});
            makeTree({json}, this.props.history)
        }).catch(rejected);
    }

    async fetchData() {
        let url = `/FamilyTree/user_personTree/${this.props.uuid}`
        let response = await fetch(url);
        if (!response.ok) throw new FetchError(response.statusText, url);
        let json = await response.json();
        return {json};
    }
}