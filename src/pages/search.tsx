import React from "react";
import {Card, Container, Row} from "react-bootstrap";
import {Link} from "react-router-dom";
import {parsePeopleResults} from "./familyOverview";
import {typePerson, typePersonBase} from "./personOverview";
import {FetchError, rejected} from "./authencation";


export type typeSearchState = { people: typePersonBase[], trees: { uuid: string, name: string }[] };
export type typeSearchProps = { query: string } ;

export class Search extends React.Component<typeSearchProps, typeSearchState> {

    constructor(props: typeSearchProps) {
        super(props);
        this.state = {trees: [], people: []};
    }

    componentDidMount() {
        this.fetchSearch().catch(rejected);
    }

    private async fetchSearch() {
        let url = `/FamilyTree/sv_search/${encodeURI(this.props.query)}`;
        let response = await fetch(url);
        if (!response.ok) throw new FetchError(response.statusText, url);
        let results = await response.json();
        let people = await parsePeopleResults<typePerson>(results);
        this.setState({people: people, trees: results.trees})
    }

    componentDidUpdate(prevProps: Readonly<typeSearchProps>, prevState: Readonly<typeSearchState>, snapshot?: any) {
        if (prevProps.query !== this.props.query) {
            this.fetchSearch().catch(rejected);
        }
    }

    render() {
        if(this.state.trees.length === 0 && this.state.people.length === 0) {
            return <Container><h1>No Search results for: {this.props.query}</h1></Container>
        }
        return (
            <Container fluid className="container body">
                <Row>
                    {this.state.trees.length > 0 ? <h1 className='w-100'>Found Families:</h1> : null}
                    {this.state.trees.map((t) => {
                        return <div key={t.uuid} className="col col-md-2">
                            <Link to={`/family_overview/${t.uuid}`}><i className="fas fa-tree"/> {t.name}</Link>
                        </div>
                    })}
                </Row>
                <Row>
                    {this.state.people.length > 0 ? <h1 className='w-100'>People Found: </h1> : null}
                    {this.state.people.map((p) => {
                        return <div key={p.uuid} className="col col-md-3">
                            <PersonSearchCard key={p.uuid} person={p}/>
                        </div>
                    })}
                </Row>
            </Container>
        )
    }
}

class PersonSearchCard extends React.Component<{ person: typePersonBase }> {

    render() {
        let p = this.props.person;
        return <Card>
            <Card.Img variant="top" className='user-image small'
                      src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
            <Card.Body>
                <Card.Title>{p.fullname} [{this.getIcon()}]</Card.Title>
                <Card.Subtitle className=" mb-2 text-muted">in {p.family}</Card.Subtitle>
                <Card.Text>
                    <i className="fas fa-birthday-cake"/> { p.birthday.toDateString()}
                </Card.Text>
                <Link to={`/person_overview/${p.uuid}`} className="stretched-link"/>
            </Card.Body>
        </Card>
    }

    private getIcon() {
        switch (this.props.person.gender) {
            case "Male": return <i className="fas fa-mars"/>;
            case "Female": return <i className="fas fa-venus"/>;
            case "Other": return <i className="fas fa-genderless"/>;
        }
        return <></>;
    }
}