import React, {ChangeEvent} from "react";
import {fetchPerson, typePersonAll, typePersonBase, typePersonOverviewProps, typePersonOverviewState, typePersonRelation} from "./personOverview";
import {Button, Card, Col, Container, Form, ListGroup, ListGroupItem, Row} from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import {rejected} from "./authencation";
import {formatDate, toHashMap} from "./util";

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
type typePersonCardEditableState = typePersonOverviewState & { validParents: typePersonBase[], editablePerson: typePersonAll }

/**
 * Component that holds the data for
 */
export class PersonEdit extends React.Component<typePersonOverviewProps, typePersonCardEditableState> {


    componentDidMount() {
        this.fetch().catch(rejected);
    }

    async fetch() {
        let [{owner, person}, {validParents}] = await Promise.all([fetchPerson(this.props.uuid), this.fetchValidParents()]);
        this.setState({
            owner: owner,
            person: person,
            editablePerson: {...person},
            validParents: validParents
        })
    }

    async fetchValidParents(): Promise<{ validParents: typePersonBase[] }> {
        let response = await fetch(`/FamilyTree/user_validParents/${this.props.uuid}`)
        if (response.ok) {
            let json = await response.json();
            let parents: typePersonBase[] = json.parents;
            return {validParents: parents};
        }
        throw new Error(response.statusText);
    }

    save() {
        this.editPerson().catch(rejected);
    }

    async editPerson() {
        let editablePerson = this.state.editablePerson;
        let json = {
            ...editablePerson,
            birthday: formatDate(editablePerson.birthday),
            passingdate: formatDate(editablePerson.passingdate),
            parents: editablePerson.parents.filter(p => !!p.uuid)
        }
        let response = await fetch(`/FamilyTree/user_editPerson/${this.props.uuid}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(json)
        })
        if (response.ok) {
            let json = await response.json();
            if(json.status === "success") {
                alert('Saved');
                await this.fetch();
            } else {
                throw new Error(json.message);
            }
        } else {
            throw new Error(response.statusText);
        }
    }

    render() {
        if (!this.state) return <Container><Card>Loading.. </Card></Container>
        let p = this.state.editablePerson;
        return <Container className={"p-3"}>
            <Form>
                <Card>
                    <Row className="m-0">
                        <Col md={4} className="p-0 border-right  v-scroll">
                            <Card.Img variant="top" className='user-image small' src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
                            {/*<this.PersonCardEditList person={p} validParents={this.state.validParents} thiz={this}/>*/}
                            {this.renderList()}
                        </Col>
                        <Col md={8}>
                            <h1>{p.name} <Button onClick={this.save.bind(this)}>Save</Button></h1>
                            <hr/>
                            <textarea className={'w-100'} defaultValue={p.description || ''} onChange={(e) => this.updateDesc(e)}/>
                            <hr/>
                            <ReactMarkdown>{(p.description || '')}
                            </ReactMarkdown>
                            <code><pre>
                                {JSON.stringify(this.state.editablePerson, null, 4)}
                                </pre>
                            </code>
                        </Col>
                    </Row>

                </Card>
            </Form>
        </Container>
    }

    private updateDesc(e: React.ChangeEvent<HTMLTextAreaElement>) {
        let target = e.target;
        let description = target.value;
        this.setState(prevState => {
            return {editablePerson: {...prevState.editablePerson, description}};
        });
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
            let map = toHashMap<typePersonRelation>(prev.validParents, t => t.uuid);
            let uuid = e.target.value;
            let name = map[uuid]?.name || '';

            let parents: typePersonRelation[] = [];

            parents.push(number === 0 ? {uuid, name} : (prev.editablePerson.parents[0] || {name: '', uuid: ''}))
            parents.push(number === 1 ? {uuid, name} : (prev.editablePerson.parents[1] || {name: '', uuid: ''}))
            return {editablePerson: {...prev.editablePerson, parents: parents}};
        })
    }
}

abstract class PersonEditFieldBase<T extends HTMLElement, S extends typeEditableBaseProps<T>> extends React.Component<S> {
    render() {
        let width = this.props.pre ? 45 : 90;
        return <ListGroupItem className={"m-0"}>
            <label className="float-lg-left">
                <i className={this.props.faIcon}/> {this.props.pre || ''}
            </label>
            <div className={"float-lg-right text-right"} style={{width: width + '%'}}>
                {this.getInput()}
            </div>
        </ListGroupItem>
    }

    abstract getInput(): JSX.Element
}

class PersonEditFieldInput extends PersonEditFieldBase<HTMLInputElement, typeEditableInputProps> {

    getInput(): JSX.Element {
        return <input className={"m-0 w-100"} type={this.props.type} defaultValue={this.props.currentValue as string | number}
                      placeholder={this.props.placeholder} onChange={(event => this.props.change(event))}/>;
    }
}

class PersonEditFieldSelect extends PersonEditFieldBase<HTMLSelectElement, typeEditableSelectProps> {

    getInput(): JSX.Element {
        let currentValue = this.props.currentValue as typeSelectValue | undefined;
        let allowedValues = this.props.allowedValues;
        return <select className="m-0 w-100 form-select" aria-label="Default select example" defaultValue={currentValue?.value}
                       onChange={(event => this.props.change(event))}>
            {allowedValues.map((option: typeSelectValue) => {
                return <option key={option.value} value={option.value}>{option.displayValue}</option>
            })}
        </select>
    }
}