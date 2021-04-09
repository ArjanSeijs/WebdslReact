import React from "react";
import {Card, Col, Container, ListGroup, ListGroupItem, Row} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import {Link} from "react-router-dom";

export type typePersonBase = { family: string; uuid: string, name: string, birthday: Date, gender: string, image: string };

type typePersonRelation = { uuid: string, name: string };
type typePersonData = { passingDate?: Date, birthplace?: string, parents: typePersonRelation[] }
type typePersonOptionalData =
    { children: typePersonRelation[], siblings: typePersonRelation[], description?: string, firstname?: string, middlenames?: string, lastname?: string }
    & typePersonData;

export type typePersonOverview = typePersonBase & typePersonData;
export type typePersonOverviewAll = typePersonOverview & typePersonOptionalData;

export class PersonOverview extends React.Component<{ id: string }, { person?: typePersonOverviewAll }> {

    constructor(p: { id: string }) {
        super(p);
        this.state = {}
    }

    async fetchPerson() {
        let response = await fetch(`/FamilyTree/user_person/${this.props.id}`);
        if (response.ok) {
            let result = await response.json();
            console.log(result)
            let person = await parsePersonResults<typePersonOverviewAll>(result);
            this.setState({person: person})
        }
    }

    componentDidMount() {
        this.update();
    }

    private update() {
        this.fetchPerson().catch(e => {
            alert('Could not reach server');
            console.error(e)
        });
    }

    componentDidUpdate(prevProps: Readonly<{ id: string }>, prevState: Readonly<{ person?: typePersonOverviewAll }>, snapshot?: any) {
        if (prevProps.id !== this.props.id) this.update();
    }

    render() {
        let p = this.state.person;
        return <Container className={"p-3 h-auto"}>
            <Card>
                <Row className="m-0">
                    {!p ? null :
                        <>
                            <Col md={4} className="p-0 border-right">
                                <Card.Img variant="top" className='user-image small' src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
                                <PersonCardListExtended person={p}/>
                            </Col>
                            <Col md={8}>
                                <h1>{p.name}</h1>
                                <hr/>
                                <ReactMarkdown>{p.description || ''}</ReactMarkdown>
                            </Col>
                        </>
                    }
                </Row>
            </Card>
        </Container>
    }
}

export async function getImage(uuid: string) {
    let image = await fetch(`/FamilyTree/getImageFile/${uuid}`)
    return window.URL.createObjectURL(await image.blob());
}

async function parsePersonResults<T extends typePersonBase>(results: any): Promise<T> {
    let p = results.person;
    p.birthday = new Date(p.birthday);
    p.passingDate = p.passingDate ? new Date(p.passingDate) : null;
    p.image = await getImage(p.uuid)
    return p as T;
}

export class PersonCard extends React.Component<{ person: typePersonOverview, link?: boolean }> {

    render() {
        let p = this.props.person;
        return <Card className="h-100">
            <Card.Img variant="top" className='user-image small' src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
            <Card.Body className="p-0">
                <Card.Title className="p-3">{p.name}</Card.Title>
                <div className="card-text">
                    <PersonCardList person={p}/>
                </div>
                {this.props.link ? <Link to={`/person_overview/${p.uuid}`} className="stretched-link"/> : null}
            </Card.Body>

        </Card>
    }
}

class PersonCardListExtended extends React.Component<{ person: typePersonOverviewAll }> {
    render() {
        let {birthday, birthplace, children, firstname, gender, lastname, middlenames, parents, passingDate, siblings} = this.props.person;
        let p0 = parents[0];
        let p1 = parents[1];
        return <ListGroup className="list-group-flush">
            <PersonCardListItem faIcon="fas fa-tag" pre="Firstname : " value={firstname}/>
            <PersonCardListItem faIcon="fas fa-tag" pre="Middle Name(s) : " value={middlenames}/>
            <PersonCardListItem faIcon="fas fa-tag" pre="Lastname : " value={lastname}/>
            <PersonCardListItem faIcon="fas fa-venus-mars" value={gender}/>
            <PersonCardListItem faIcon="fas fa-birthday-cake" value={birthday.toDateString()}/>
            <PersonCardListItem faIcon="fas fa-cross" value={passingDate?.toDateString()} placeholder="Alive"/>
            <PersonCardListItem faIcon="fas fa-city" value={birthplace} placeholder="Birthplace"/>
            <PersonCardListItem faIcon="fas fa-calendar-alt" value={age(passingDate || new Date(), birthday) + " years"}/>
            <PersonCardListItem link={p0 ? `/person_overview/${p0.uuid}` : undefined} faIcon="fas fa-user-tie" value={p0?.name} placeholder="Parent"/>
            <PersonCardListItem link={p1 ? `/person_overview/${p1.uuid}` : undefined} faIcon="fas fa-user-tie" value={p1?.name} placeholder="Parent"/>
            {children?.map(c => <PersonCardListItem link={`/person_overview/${c.uuid}`} key={c.uuid} faIcon="fas fa-baby" value={c.name}/>)}
            {siblings?.map(s => <PersonCardListItem link={`/person_overview/${s.uuid}`} key={s.uuid} faIcon="fas fa-user-friends" value={s.name}/>)}
        </ListGroup>;
    }
}

class PersonCardList extends React.Component<{ person: typePersonOverview }> {
    render() {
        let p = this.props.person;
        return <ListGroup className="list-group-flush">
            <PersonCardListItem faIcon="fas fa-venus-mars" value={p.gender}/>
            <PersonCardListItem faIcon="fas fa-birthday-cake" value={p.birthday.toDateString()}/>
            <PersonCardListItem faIcon="fas fa-cross" value={p.passingDate?.toDateString()} placeholder="Alive"/>
            <PersonCardListItem faIcon="fas fa-city" value={p.birthplace} placeholder="Birthplace"/>
            <PersonCardListItem faIcon="fas fa-calendar-alt" value={age(p.passingDate || new Date(), p.birthday) + " years"}/>
            <PersonCardListItem faIcon="fas fa-user-tie" value={p.parents[0]?.name} placeholder="Parent"/>
            <PersonCardListItem faIcon="fas fa-user-tie" value={p.parents[1]?.name} placeholder="Parent"/>
        </ListGroup>;
    }
}

function age(date: Date, birthday: Date) {
    let age = date.getFullYear() - birthday.getFullYear();
    if (date.getMonth() < birthday.getMonth()) {
        age--;
    } else if (date.getMonth() === birthday.getMonth() && date.getDate() < birthday.getDate()) {
        age--;
    }
    return age;
}

type typePersonCardListItem = { link?: string, faIcon: string, pre?: string, value: string | undefined, placeholder?: string };

class PersonCardListItem extends React.Component<typePersonCardListItem> {
    render() {
        let listGroupItem = <>
            <div className="float-left"><i className={this.props.faIcon}/> {this.props.pre || ''}</div>
            <div className="float-right">{this.props.value ? this.props.value :
                <span className="text-muted">{this.props.placeholder}</span>}</div>
        </>;
        if (this.props.link) listGroupItem = <Link to={this.props.link}>{listGroupItem}</Link>;
        return <ListGroupItem>
            {listGroupItem}
        </ListGroupItem>
    }
}