import '../stylesheets/style.css'

import React from "react";
import {Button, Container, DropdownButton, Form, InputGroup, Row} from "react-bootstrap";
import {typePersonBase, PersonCard, typePerson, parsePersonResults} from "./personOverview";
import {AuthenticationState, rejected} from "./authencation";
import {observer} from "mobx-react";
import {toHashMap} from "./util";

/** direction : sort ascending or descending, sortFunc : comparator, genders : the genders to display, search : users to filter*/
type typeFilterState = { direction: 1 | -1; sort: string, sortFunc: (a: typePerson, b: typePerson) => number; genders: string[], status: { alive: boolean, deceased: boolean }, search: string; };
/** */
type typeFamilyState = { people: typePerson[], name: string, owner: string };

/** {@see FamilyOverview}*/
type familyOverviewState = typeFamilyState & typeFilterState;
/** {@see FamilyOverview}*/
type familyOverviewType = { uuid: string };

@observer
export class FamilyOverview extends React.Component<familyOverviewType, familyOverviewState> {

    constructor(props: familyOverviewType) {
        super(props);
        let sortFunc = this.sortName.bind(this);
        let filters: string[] = [];
        let alive = {alive: false, deceased: false}
        this.state = {people: [], direction: 1, sort: 'Name', genders: filters, status: alive, search: '', sortFunc, name: '', owner: ''};
    }

    /**
     * Retrieves all the people in this family and transforms it using {@link parsePeopleResults}
     */
    async fetchPeople() {
        let response = await fetch(`/FamilyTree/user_people/${this.props.uuid}`);
        if (response.ok) {
            let result = await response.json();
            let people = await parsePeopleResults<typePerson>(result);
            this.setState({people: people, name: result.name, owner: result.owner})
        }
    }

    componentDidMount() {
        this.update();
    }

    private update() {
        this.fetchPeople().catch(rejected);
    }

    /**
     * Put request to edit family name
     * @private
     */
    private async editName() {
        let newName = prompt('Edit name', this.state.name)
        if (newName && newName !== this.state.name) {
            let response = await fetch(`/FamilyTree/user_setFamilyName/${this.props.uuid}`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: newName
            })
            if (response.ok) {
                this.setState({name: newName})
            } else {
                throw new Error(response.statusText);
            }
        }
    }

    render() {
        let editable = this.state.owner === AuthenticationState.instance.username && AuthenticationState.instance.isLoggedIn();
        return <Container className="p-2">
            <h1>{this.state.name}
                {!editable ? null : <Button onClick={() => this.editName().catch(rejected)}><i className="fas fa-pen-square"/></Button>}
            </h1>
            <Form onChange={(e) => this.filterChange(e)}>
                <InputGroup className="mb-3">
                    <Form.Control placeholder="Search" aria-label="search" aria-describedby="basic-addon2" data-type='search'/>
                    <DropdownButton as={InputGroup.Append} variant="secondary" title="Filter" id="input-group-dropdown-filter">
                        <div className="dropdown-item deco-none">
                            <Form.Check custom type={"checkbox"} data-type='filter-alive' id={"Alive"} label={"Alive"}/>
                        </div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom type={"checkbox"} data-type='filter-alive' id={"Deceased"} label={"Deceased"}/></div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom type={"checkbox"} data-type='filter-gender' id={"Male"} label={"Male"}/>
                        </div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom type={"checkbox"} data-type='filter-gender' id={"Female"} label={"Female"}/>
                        </div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom type={"checkbox"} data-type='filter-gender' id={"Other"} label={"Other"}/>
                        </div>
                    </DropdownButton>
                    <DropdownButton as={InputGroup.Append} variant="secondary" title="Sort" id="input-group-dropdown-sort">
                        <div className="dropdown-item deco-none">
                            <Form.Check custom name="sort" defaultChecked type={"radio"} data-type='sort' id={"Name"} label={"Name"}/>
                        </div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom name="sort" type={"radio"} data-type='sort' id={"Birthday"} label={"Birthday"}/>
                        </div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom name="sort" type={"radio"} data-type='sort' id={"Passing"} label={"Passing Date"}/>
                        </div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom name="sort" type={"radio"} data-type='sort' id={"Birthplace"} label={"Birthplace"}/>
                        </div>
                        <div className="dropdown-item deco-none">
                            <Form.Check custom name="sort" type={"radio"} data-type='sort' id={"Gender"} label={"Gender"}/>
                        </div>
                    </DropdownButton>
                    <InputGroup.Append>

                        <Button variant="primary" onClick={() => this.toggleDir()}>
                            {(() => {
                                let sort = this.state.sort;
                                let direction = this.state.direction;
                                if (sort === 'Name' || sort === 'Birthplace' || sort === 'Gender')
                                    return direction === 1 ? <i className="fas fa-sort-alpha-up"/> : <i className="fas fa-sort-alpha-down"/>
                                return direction === 1 ? <i className="fas fa-sort-amount-up-alt"/> : <i className="fas fa-sort-amount-down-alt"/>
                            })()}
                        </Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form>
            <Row>
                {this.state.people.length === 0 ? <div>Loading ... </div> :
                    this.state.people
                        .filter((p) => this.filterFunc(p))
                        .filter((p) => this.searchFunc(p))
                        .sort((a, b) => this.state.sortFunc(a, b))
                        .map(p => <div className="col-md-3 p-1" key={p.uuid}><PersonCard person={p} link={true}/></div>)
                }
            </Row>
        </Container>
    }

    /**
     *  We update the filters on form value changes
     * @param e
     * @private
     */
    private filterChange(e: React.FormEvent<HTMLFormElement>) {
        let target = e.target as HTMLInputElement;
        let type = target.getAttribute('data-type');
        if (type === 'sort') {
            this.updateSort(target);
        } else if (type === 'filter-gender') {
            this.updateGenderFilter(target);
        } else if (type === 'filter-alive') {
            this.updateAliveFilter(target);
        } else if (type === 'search') {
            this.updateSearch(target);
        }
    }

    /**
     * Uses the target parameter to update {@link typeFilterState.genders}
     * @param target
     * @private
     */
    private updateGenderFilter(target: HTMLInputElement) {
        let g = target.id;
        let genders = this.state.genders;
        if (!target.checked && genders.indexOf(g) !== -1) {
            genders = genders.filter((x) => x !== g);
            this.setState({genders: genders});
        } else if (target.checked && genders.indexOf(g) === -1) {
            genders.push(g);
            this.setState({genders: genders})
        }
    }

    /**
     * Uses the target parameter to update {@link typeFilterState.genders}
     * @param target
     * @private
     */
    private updateAliveFilter(target: HTMLInputElement) {
        let status = target.id
        if (status === "Alive") {
            this.setState(({status}) => {
                return {status: {alive: target.checked, deceased: status.deceased}};
            })
        }
        if (status === "Deceased") {
            this.setState(({status}) => {
                return ({status: {alive: status.alive, deceased: target.checked}});
            })
        }
    }

    /**
     * Changes the {@link typeFilterState#sortFunc} to a sorting method depending on the target
     * @see FamilyOverview#sortBirthplace
     * @see FamilyOverview#sortPassingDate
     * @see FamilyOverview#sortBirthday
     * @see FamilyOverview#sortGender
     * @see FamilyOverview#sortName
     * @param target
     * @private
     */
    private updateSort(target: HTMLInputElement) {
        let sort = target.id;
        switch (sort) {
            case "Birthday":
                this.setState({sortFunc: this.sortBirthday.bind(this), sort});
                break;
            case "Passing":
                this.setState({sortFunc: this.sortPassingDate(new Date()).bind(this), sort});
                break;
            case "Birthplace":
                this.setState({sortFunc: this.sortBirthplace.bind(this), sort});
                break;
            case "Name":
                this.setState({sortFunc: this.sortName.bind(this), sort});
                break;
            case "Gender":
                this.setState({sortFunc: this.sortGender.bind(this), sort});
                break;
        }
    }

    /**
     * Changes {@link typeFilterState.search} string
     * @param target
     * @private
     */
    private updateSearch(target: HTMLInputElement) {
        let search = target.value;
        this.setState({search})
    }

    private sortBirthplace(p1: typePerson, p2: typePerson) {
        let a = (p1.birthplace || '').toLowerCase()
        let b = (p2.birthplace || '').toLowerCase()
        if (a === '' && b === '') return this.sortName(p1, p2) * this.state.direction;
        if (a === '') return 1;
        if (b === '') return -1;
        if (a === b) return this.sortName(p1, p2) * this.state.direction;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private sortPassingDate(now: Date) {
        return (p1: typePerson, p2: typePerson) => {
            let a = p1.passingdate || now;
            let b = p2.passingdate || now;
            let diff = a.getTime() - b.getTime();
            return diff !== 0 ? diff * this.state.direction : this.sortName(p1, p2) * this.state.direction;
        }
    }

    private sortBirthday(p1: typePerson, p2: typePerson) {
        let a = p1.birthday;
        let b = p2.birthday;
        let diff = a.getTime() - b.getTime();
        return diff !== 0 ? diff * this.state.direction : this.sortName(p1, p2) * this.state.direction;
    }

    private sortGender(p1: typePerson, p2: typePerson) {
        let a = p1.gender.toLowerCase();
        let b = p2.gender.toLowerCase();
        if (a === b) return this.sortName(p1, p2) * this.state.direction;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private sortName(p1: typePerson, p2: typePerson) {
        let a = p1.name.toLowerCase();
        let b = p2.name.toLowerCase()
        if (a === b) return 0;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private toggleDir() {
        if (this.state.direction === 1) this.setState({direction: -1})
        else this.setState({direction: 1})
    }

    private filterFunc(p: typePerson): boolean {
        let state = this.state;
        let gender = (state.genders.length === 0 || state.genders.indexOf(p.gender) !== -1);
        let statusSelected = (!state.status.alive && !state.status.deceased)
        let statusCorrect = (state.status.alive && !p.passingdate) || (state.status.deceased && !!p.passingdate);
        return gender && (statusSelected || statusCorrect);
    }

    private searchFunc(p: typePerson): boolean {
        return this.state.search.length === 0 || p.name.toLowerCase().includes(this.state.search.toLowerCase());
    }
}


/**
 *
 * @param results
 */
export async function parsePeopleResults<T extends typePersonBase>(results: any): Promise<T[]> {
    let people = toHashMap<T>(results.people, t => t.uuid);
    return await Promise.all<T>(results.people.map(async (p: any) => {
        p = await parsePersonResults(p)
        p.parents = p.parents?.map((uuid: string) => {
            return {uuid: uuid, name: people[uuid]?.name}
        });
        return p as T;
    }));
}