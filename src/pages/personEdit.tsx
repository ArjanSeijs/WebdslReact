import React, {ChangeEvent} from "react";
import {fetchPerson, typePersonAll, typePersonBase, typePersonOverviewProps, typePersonOverviewState, typePersonId} from "./personOverview";
import {Button, Card, Col, Container, Form, ListGroup, ListGroupItem, Row} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import {FetchError, rejected} from "./authencation";
import {formatDate, toHashMap} from "./util";
import {typeHistoryProps} from "../App";

/** Use for an <option value={value}>{name}</option> in a select input*/
type typeSelectValue = { value: string, displayValue: string };
/** Default value of an <input></input> or */
type typeValue = string | number | undefined | typeSelectValue;
/** Props for {@see PersonEditFieldBase} */
type typeEditableBaseProps<T extends HTMLElement> = { faIcon: string, pre?: string, currentValue: typeValue, placeholder?: string, type: string, change: (e: ChangeEvent<T>) => void };
/** Props for {@see PersonEditFieldSelect} */
type typeEditableSelectProps = typeEditableBaseProps<HTMLSelectElement> & { allowedValues: typeSelectValue[] }
/** Props for {@see PersonEditFieldInput} */
type typeEditableInputProps = typeEditableBaseProps<HTMLInputElement>

/** State for {@see PersonEdit}*/
type typePersonCardEditableState =
    typePersonOverviewState
    & { validParents: typePersonBase[], editablePerson: typePersonAll }
/** Props for {@see PersonEdit}*/
export type typePersonCardEditProps = typePersonOverviewProps & typeHistoryProps;

/**
 * Component that holds the data for
 */
export class PersonEdit extends React.Component<typePersonCardEditProps, typePersonCardEditableState> {


    componentDidMount() {
        this.fetch().catch(rejected);
    }

    /**
     * Fetch both the person and allowed parents, and update state accordingly
     */
    async fetch() {
        let [{family, person}, {validParents}] = await Promise.all([fetchPerson(this.props.uuid), this.fetchValidParents()]);
        this.setState({
            family: family,
            person: person,
            editablePerson: {...person},
            validParents: validParents,
        })
    }

    /**
     * Get a list in form {uuid : string, name : string}[] with all family members that are allowed to be a parent of this person
     */
    async fetchValidParents(): Promise<{ validParents: typePersonBase[] }> {
        let url = `/FamilyTree/user_validParents/${this.props.uuid}`;
        let response = await fetch(url)
        if (!response.ok) throw new FetchError(response.statusText, url);
        let json = await response.json();
        let parents: typePersonBase[] = json.parents;
        return {validParents: parents};
    }

    render() {
        if (!this.state) return <Container><Card>Loading.. </Card></Container>
        let p = this.state.editablePerson;
        return <Container className={"p-3"}>
            <Form>
                <Card>
                    <Row className="m-0">
                        <Col md={4} className="p-0 border-right  v-scroll">
                            <Card.Img variant="top" className='user-image small' id="image-preview"
                                      src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
                            {this.renderList()}
                        </Col>
                        <Col md={8}>
                            <h1>{p.fullname} </h1>
                            <hr/>
                            <textarea className={'w-100 h-50'} defaultValue={p.description || ''} onChange={(e) => this.updateDesc(e)}/>
                            <hr/>
                            <ReactMarkdown>{(p.description || '')}
                            </ReactMarkdown>
                            <Button onClick={this.save.bind(this)}>Save</Button><Button variant="danger" onClick={this.delete.bind(this)}>delete</Button>
                        </Col>
                    </Row>
                </Card>
            </Form>
        </Container>
    }

    /**
     * List with some information about a person for usage in
     */
    renderList() {
        let {birthday, birthplace, gender, parents, passingdate, firstname, lastname, middlenames} = this.state.editablePerson;
        let validParents = this.state.validParents.map(x => ({value: x.uuid, displayValue: x.name}))
        validParents = [{displayValue: '', value: ''}].concat(validParents);
        let validGenders = ["Male", "Female", "Other"].map(s => ({value: s, displayValue: s}));
        let p0 = parents[0], p1 = parents[1];
        let value0 = p0 ? {displayValue: p0.name, value: p0.uuid} : undefined;
        let value1 = p1 ? {displayValue: p1.name, value: p1.uuid} : undefined;

        let currentValue = {displayValue: gender, value: gender};
        return <ListGroup className="list-group-flush">
            <PersonEditFieldInput faIcon="fas fa-tag" pre="Firstname : " currentValue={firstname} type={'text'}
                                  change={(e) => this.updateFirstname(e)}/>
            <PersonEditFieldInput faIcon="fas fa-tag" pre="Middle Name(s) : " currentValue={middlenames} type={'text'}
                                  change={(e) => this.updateMiddlenames(e)}/>
            <PersonEditFieldInput faIcon="fas fa-tag" pre="Lastname : " currentValue={lastname} type={'text'}
                                  change={(e) => this.updateLastname(e)}/>
            <PersonEditFieldSelect faIcon="fas fa-venus-mars" currentValue={currentValue} allowedValues={validGenders} type={'select'}
                                   change={(e) => this.updateGender(e)}/>
            <PersonEditFieldInput faIcon="fas fa-birthday-cake" currentValue={formatDate(birthday)} type={'date'}
                                  change={(e) => this.updateBirthday(e)}/>
            <PersonEditFieldInput faIcon="fas fa-cross" currentValue={formatDate(passingdate)} type={'Date'}
                                  change={(e) => this.updatePassingdate(e)}/>
            <PersonEditFieldInput faIcon="fas fa-city" currentValue={birthplace} placeholder="Birthplace" type={'text'}
                                  change={(e) => this.updateBirthplace(e)}/>
            <PersonEditFieldSelect faIcon="fas fa-user-tie" currentValue={value0} allowedValues={validParents} type={'select'}
                                   change={(e) => this.updateParent(e, 0)}/>
            <PersonEditFieldSelect faIcon="fas fa-user-tie" currentValue={value1} allowedValues={validParents} type={'select'}
                                   change={(e) => this.updateParent(e, 1)}/>
        </ListGroup>;
    }

    /**
     * @see editPerson
     */
    save() {
        if (!this.state) return;
        this.editPerson().then(() => {
            alert('Saved');
            this.props.history.push(`/person_overview/${this.props.uuid}`)
        }).catch(rejected);
    }

    delete() {
        if (!this.state) return;
        let fullname = this.state.person.fullname;
        let confirmed = window.confirm('Are you sure you want to remove ' + fullname);
        if(!confirmed) return;
        this.deletePerson().then(() => {
            alert(`Person ${fullname} deleted`);
            this.props.history.push(`/family_overview/${this.state.family.uuid}`);
        }).catch(rejected);
    }


    async deletePerson() {
        let url = `/FamilyTree/user_deletePerson/${this.props.uuid}`;
        let response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
        })
        if (!response.ok) throw new FetchError(response.statusText, url);
        this.props.history.push(`/family_overview/${this.state.family.uuid}`)
    }

    /**
     * Make a post request to the server and edit this person.
     * We then retrieve the updated values from the server.
     */
    async editPerson() {
        let editablePerson = this.state.editablePerson;
        let jsonBody = {
            ...editablePerson,
            birthday: formatDate(editablePerson.birthday),
            passingdate: formatDate(editablePerson.passingdate),
            // If p.uuid is empty then a parent was removed.
            parents: editablePerson.parents.filter(p => !!p.uuid)
        }
        let url = `/FamilyTree/user_editPerson/${this.props.uuid}`;
        let response = await fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(jsonBody)
        })
        if (!response.ok) throw new FetchError(response.statusText, url);

        let json = await response.json();
        if (json.status !== "success") throw new FetchError(json.message, url);
        await this.fetch();
    }

    /**
     * Live update description
     * @param e
     * @private
     */
    private updateDesc(e: React.ChangeEvent<HTMLTextAreaElement>) {
        let target = e.target;
        let description = target.value;
        this.setState(prevState => {
            return {editablePerson: {...prevState.editablePerson, description}};
        });
    }

    // <--------------------
    // State update methods
    // ====================
    private updateFirstname(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState(prev => ({editablePerson: {...prev.editablePerson, firstname: e.target.value}}))
    }

    private updateMiddlenames(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState(prev => ({editablePerson: {...prev.editablePerson, middlenames: e.target.value}}))
    }

    private updateLastname(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState(prev => ({editablePerson: {...prev.editablePerson, lastname: e.target.value}}))
    }

    private updateGender(e: React.ChangeEvent<HTMLSelectElement>) {
        this.setState(prev => ({editablePerson: {...prev.editablePerson, gender: e.target.value}}))
    }

    private updateBirthday(e: React.ChangeEvent<HTMLInputElement>) {
        let date = new Date(e.target.value);
        if (!isNaN(date.valueOf())) this.setState(prev => ({editablePerson: {...prev.editablePerson, birthday: date}}))
    }

    private updatePassingdate(e: React.ChangeEvent<HTMLInputElement>) {
        let date = new Date(e.target.value);
        if (!isNaN(date.valueOf())) this.setState(prev => ({editablePerson: {...prev.editablePerson, passingdate: date}}))
    }

    private updateBirthplace(e: React.ChangeEvent<HTMLInputElement>) {
        this.setState(prev => ({editablePerson: {...prev.editablePerson, birthplace: e.target.value}}))
    }

    private updateParent(e: React.ChangeEvent<HTMLSelectElement>, number: number) {
        this.setState(prev => {
            let map = toHashMap<typePersonId>(prev.validParents, t => t.uuid);
            let uuid = e.target.value; // is falsy ('') when parent was removed
            let name = map[uuid]?.name || ''; //is falsy ('') if uuid is falsy.
            let fullname = map[uuid]?.fullname || ''; //is falsy ('') if uuid is falsy.

            let parents: typePersonId[] = [];

            // Update the values,
            parents.push(number === 0 ? {uuid, name, fullname} : (prev.editablePerson.parents[0] || {name: '', uuid: '', fullname: ''}))
            parents.push(number === 1 ? {uuid, name, fullname} : (prev.editablePerson.parents[1] || {name: '', uuid: '', fullname: ''}))
            return {editablePerson: {...prev.editablePerson, parents: parents}};
        })
    }

    // -------------------->
}

/**
 * The groupitems
 */
abstract class PersonEditFieldBase<T extends HTMLElement, S extends typeEditableBaseProps<T>> extends React.Component<S> {
    render() {
        let width = this.props.pre ? 45 : 90;
        return <ListGroupItem className={"m-0"}>
            <label className="float-lg-left">
                <i className={this.props.faIcon}/> {this.props.pre || ''}
            </label>
            <div className={"float-lg-right text-right input-w-" + width}>
                {this.getInput()}
            </div>
        </ListGroupItem>
    }

    abstract getInput(): JSX.Element
}

/**
 * An input type
 */
class PersonEditFieldInput extends PersonEditFieldBase<HTMLInputElement, typeEditableInputProps> {

    getInput(): JSX.Element {
        return <input className={"m-0 w-100 form-control"} type={this.props.type} defaultValue={this.props.currentValue as string | number}
                      placeholder={this.props.placeholder} onChange={(event => this.props.change(event))}/>;
    }
}

/**
 * A select type
 */
class PersonEditFieldSelect extends PersonEditFieldBase<HTMLSelectElement, typeEditableSelectProps> {

    getInput(): JSX.Element {
        let currentValue = this.props.currentValue as typeSelectValue | undefined;
        let allowedValues = this.props.allowedValues;
        return <select className="m-0 w-100 form-select form-control" aria-label="Default select example" defaultValue={currentValue?.value}
                       onChange={(event => this.props.change(event))}>
            {allowedValues.map((option: typeSelectValue) => {
                return <option key={option.value} value={option.value}>{option.displayValue}</option>
            })}
        </select>
    }
}