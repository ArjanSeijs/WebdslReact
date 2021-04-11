import React from "react";
import {Card, Col, Container, ListGroup, ListGroupItem, Row} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import {Link} from "react-router-dom";
import {observer} from "mobx-react";
import {AuthenticationState, rejected} from "./authencation";
import {age} from "./util";


/** Represents parent, child, or sibling */
export type typePersonId = { uuid: string, name: string, fullname: string };

/** Represents a person with all non-null attributes */
export type typePersonBase = { family: string; birthday: Date, gender: string, image?: string } & typePersonId;
/** Represent optinal data that can be displayed*/
type typePersonData = { passingdate?: Date, birthplace?: string, parents: typePersonId[] }
/** Represent optional data that will be used on the personal page of the person, but not in overviews (family list & search results) */
type typePersonOptionalData = { children?: typePersonId[], siblings?: typePersonId[], description?: string, firstname?: string, middlenames?: string, lastname?: string }

/** Union types for person */
export type typePerson = typePersonBase & typePersonData;
/** Union type for person */
export type typePersonAll = typePerson & typePersonOptionalData;

/** Props & State for the components */
export type typePersonCardProps = { link?: string, faIcon: string, pre?: string, value: string | number | undefined, placeholder?: string };
/** Props for {@see PersonOverview}*/
export type typePersonOverviewProps = { uuid: string };
/** State for {@see PersonOverview}*/
export type typePersonOverviewState = { person: typePersonAll, owner: string, canEdit: boolean };

/**
 * A page of a person displaying all information
 */
@observer
export class PersonOverview extends React.Component<typePersonOverviewProps, typePersonOverviewState> {

    componentDidMount() {
        this.update();
    }

    private update() {
        fetchPerson(this.props.uuid).then(this.setState.bind(this)).catch(rejected);
    }

    componentDidUpdate(prevProps: Readonly<typePersonOverviewProps>, prevState: Readonly<typePersonOverviewState>, snapshot?: any) {
        if (prevProps.uuid !== this.props.uuid) this.update();
    }

    render() {
        if (!this.state) return <Container><Card>Loading.. </Card></Container>
        let editable = (this.state.owner === AuthenticationState.instance.username || this.state.canEdit) && AuthenticationState.instance.isLoggedIn();
        let p = this.state.person;

        return <Container className={"p-3 h-auto"}>
            <Card>
                <Row className="m-0">
                    <Col md={4} className="p-0 border-right  v-scroll">
                        <Card.Img variant="top" className='user-image small' src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
                        <PersonCardListExtended person={p}/>
                    </Col>
                    <Col md={8}>
                        <h1>{p.fullname}{!editable ? null : <Link to={`/person_edit/${this.props.uuid}`}><i className="fas fa-pen-square"/></Link>}</h1>
                        <hr/>
                        <ReactMarkdown>{p.description || ''}</ReactMarkdown>
                    </Col>
                </Row>
            </Card>
        </Container>
    }
}

/**
 * A card with a person for in a overview with limited info display
 */
export class PersonCard extends React.Component<{ person: typePerson, link?: boolean }> {

    render() {
        let p = this.props.person;
        return <Card className="h-100">
            <Card.Img variant="top" className='user-image small' src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
            <Card.Body className="p-0">
                <Card.Title className="p-3">{p.fullname}</Card.Title>
                <div className="card-text">
                    <PersonCardListBase person={p}/>
                </div>
                {this.props.link ? <Link to={`/person_overview/${p.uuid}`} className="stretched-link"/> : null}
            </Card.Body>

        </Card>
    }
}

/**
 * List with some information about a person
 */
class PersonCardListBase<T extends typePerson> extends React.Component<{ person: T }> {
    render() {
        return <ListGroup className="list-group-flush">
            {this.getListGroup()}
        </ListGroup>;
    }

    getListGroup() {
        let {birthday, birthplace, gender, parents, passingdate} = this.props.person;
        let p0 = parents[0];
        let p1 = parents[1];
        return <>
            <PersonCardItem faIcon="fas fa-venus-mars" value={gender}/>
            <PersonCardItem faIcon="fas fa-birthday-cake" value={birthday.toDateString()}/>
            <PersonCardItem faIcon="fas fa-cross" value={passingdate?.toDateString()} placeholder="Alive"/>
            <PersonCardItem faIcon="fas fa-city" value={birthplace} placeholder="Birthplace"/>
            <PersonCardItem faIcon="fas fa-calendar-alt" value={age(passingdate || new Date(), birthday) + " years"}/>
            <PersonCardItem link={p0 ? `/person_overview/${p0.uuid}` : undefined} faIcon="fas fa-user-tie" value={p0?.name} placeholder="Parent"/>
            <PersonCardItem link={p1 ? `/person_overview/${p1.uuid}` : undefined} faIcon="fas fa-user-tie" value={p1?.name} placeholder="Parent"/>
        </>;
    }

}

/**
 * Longer version of {@link PersonCardListBase}
 */
class PersonCardListExtended extends PersonCardListBase<typePersonAll> {
    getListGroup() {
        let {children, firstname, lastname, middlenames, siblings} = this.props.person;
        return <ListGroup className="list-group-flush">
            <PersonCardItem faIcon="fas fa-tag" pre="Firstname : " value={firstname}/>
            <PersonCardItem faIcon="fas fa-tag" pre="Middle Name(s) : " value={middlenames}/>
            <PersonCardItem faIcon="fas fa-tag" pre="Lastname : " value={lastname}/>
            {super.getListGroup()}
            {children?.map(c => <PersonCardItem link={`/person_overview/${c.uuid}`} key={c.uuid} faIcon="fas fa-baby" value={c.name}/>)}
            {siblings?.map(s => <PersonCardItem link={`/person_overview/${s.uuid}`} key={s.uuid} faIcon="fas fa-user-friends" value={s.name}/>)}
        </ListGroup>;
    }
}

/**
 * An item used in {@link PersonCardListBase}
 */
class PersonCardItem extends React.Component<typePersonCardProps> {
    render() {
        let listGroupItem = <>
            <div className="float-left"><i className={this.props.faIcon}/> {this.props.pre || ''}</div>
            <div className="float-right">{this.props.value ? this.props.value :
                <span className="text-muted">{this.props.placeholder}</span>}</div>
        </>;
        if (this.props.link) {
            return <ListGroupItem style={{zIndex: 2, position: 'inherit'}}><Link to={this.props.link}>{listGroupItem}</Link></ListGroupItem>
        }
        return <ListGroupItem>
            {listGroupItem}
        </ListGroupItem>
    }
}

/**
 * Retrieves person with uuid from the server and transforms it using {@link parsePersonResults}
 * @param uuid
 * @param all
 */
export async function fetchPerson(uuid: string): Promise<typePersonOverviewState> {
    let response = await fetch(`/FamilyTree/user_person/${uuid}`);
    if (!response.ok) throw new Error(response.statusText);
    let result = await response.json();
    let person = await parsePersonResults<typePersonAll>(result.person);
    return {person: person, owner: result.owner, canEdit : result.canEdit} as typePersonOverviewState;
}

/**
 * Transforms the resulted json representation from the server and retrieves the image url.
 * @param person
 */
export async function parsePersonResults<T extends typePersonBase>(person: any): Promise<T> {
    person.birthday = new Date(person.birthday);
    person.passingdate = person.passingdate ? new Date(person.passingdate) : null;
    person.image = await getImage(person.uuid)
    return person as T;
}

/**
 * Gets the url to a image of a user
 * @param uuid
 */
export async function getImage(uuid: string): Promise<string> {
    let image = await fetch(`/FamilyTree/getImageFile/${uuid}`)
    return window.URL.createObjectURL(await image.blob());
}