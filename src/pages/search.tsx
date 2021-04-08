import React from "react";
import {Card, Container, Row} from "react-bootstrap";
import {Link} from "react-router-dom";


type Person = { family: string; uuid: string, name: string, birthday: Date, gender: string, image: string };
type searchState = { people: Person[], trees: { uuid: string, name: string }[] };
type searchProps = { query: string };

export class Search extends React.Component<searchProps, searchState> {

    constructor(props: searchProps) {
        super(props);
        this.state = {trees: [], people: []};
    }

    componentDidMount() {
        this.fetchSearch().catch((e) => {
            alert('Could not reach server');
            console.error(e)
        });
    }

    private async fetchSearch() {
        let response = await fetch(`/FamilyTree/sv_search/${encodeURI(this.props.query)}`);
        if (response.ok) {
            let results = await response.json();
            let people = await Promise.all<Person>(results.people.map(async (p: any) => {
                let image = await fetch('/FamilyTree/getImageFile/' + p.uuid)
                p.birthday = new Date(p.birthday);
                p.image = window.URL.createObjectURL(await image.blob())
                return p as Person;
            }));
            this.setState({people: people, trees: results.trees})
        } else {
            alert('Could not reach server')
        }
    }

    componentDidUpdate(prevProps: Readonly<searchProps>, prevState: Readonly<searchState>, snapshot?: any) {
        if (prevProps.query != this.props.query) {
            this.fetchSearch().catch((e) => {
                alert('Could not reach server');
                console.error(e)
            });
        }
    }

    render() {
        return (
            <Container fluid className="container body">
                <Row>
                    {this.state.trees.length > 0 ? <h1 className='w-100'>Found Families:</h1> : null}
                    {this.state.trees.map((t) => {
                        return <div key={t.uuid} className="col col-md-3">
                            <Link to={`/family/${t.uuid}`}>{t.name}</Link>
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

class PersonSearchCard extends React.Component<{ person: Person }> {

    render() {
        let p = this.props.person;
        return <Card>
            <Card.Img variant="top" className='user-image small'
                      src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
            <Card.Body>
                <Card.Title>{p.name} [{p.gender.substr(0, 1)}]</Card.Title>
                <Card.Subtitle className=" mb-2 text-muted">in {p.family}</Card.Subtitle>
                <Card.Text>
                    {p.birthday.toDateString()}
                </Card.Text>
                <Link to={`/person/${p.uuid}`} className="stretched-link"/>
            </Card.Body>
        </Card>
    }
}