import '../stylesheets/style.css'

import React from "react";
import {Button, Container, DropdownButton, Form, InputGroup, Row} from "react-bootstrap";
import {getImage, typePersonBase, PersonCard, typePersonOverview} from "./personOverview";

type familyOverviewFilter = {
    direction: 1 | -1;
    sort: string
    sortFunc: (a: typePersonOverview, b: typePersonOverview) => number;
    filters: string[]
    search: string;
};
type familyOverviewState = { people: typePersonOverview[], name: string } & familyOverviewFilter;
type familyOverviewType = { id: string };

export class FamilyOverview extends React.Component<familyOverviewType, familyOverviewState> {

    constructor(props: familyOverviewType) {
        super(props);
        let sortFunc = this.sortName.bind(this);
        let filters: string[] = [];
        this.state = {people: [], direction: 1, sort: 'Name', filters, search: '', sortFunc, name: ''};
    }

    async fetchPeople() {
        let response = await fetch(`/FamilyTree/user_people/${this.props.id}`);
        if (response.ok) {
            let result = await response.json();
            let people = await parsePeopleResults<typePersonOverview>(result);
            this.setState({people: people, name: result.name})
        }
    }

    componentDidMount() {
        this.fetchPeople().catch(e => {
            alert('Could not reach server');
            console.error(e)
        });
    }

    render() {
        return <Container className="p-2">
            <h1>{this.state.name}</h1>
            <Form onChange={(e) => this.filterChange(e)}>
                <InputGroup className="mb-3">
                    <Form.Control placeholder="Search" aria-label="search" aria-describedby="basic-addon2" data-type='search'/>
                    <DropdownButton as={InputGroup.Append} variant="secondary" title="Filter" id="input-group-dropdown-filter">
                        <div className="dropdown-item deco-none"><Form.Check custom type={"checkbox"} data-type='filter' id={"Male"} label={"Male"}/></div>
                        <div className="dropdown-item deco-none"><Form.Check custom type={"checkbox"} data-type='filter' id={"Female"} label={"Female"}/></div>
                        <div className="dropdown-item deco-none"><Form.Check custom type={"checkbox"} data-type='filter' id={"Other"} label={"Other"}/></div>
                    </DropdownButton>
                    <DropdownButton as={InputGroup.Append} variant="secondary" title="Sort" id="input-group-dropdown-sort">
                        <div className="dropdown-item deco-none">
                            <Form.Check custom name="sort" type={"radio"} data-type='sort' id={"Name"} label={"Name"}/>
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

                        <Button variant="secondary" onClick={() => this.toggleDir()}>
                            {(() => {
                                let sort = this.state.sort;
                                let direction = this.state.direction;
                                if (sort === 'Name' || sort === 'Birthplace' || sort === 'Gender')
                                    return direction === 1 ? <i className="fas fa-sort-alpha-up"/> : <i className="fas fa-sort-alpha-down"/>
                                return direction === 1 ? <i className="fas fa-sort-amount-up-alt"/> : <i className="fas fa-sort-amount-down-alt"/>
                            })()}
                        </Button>
                    </InputGroup.Append>
                    <InputGroup.Append>
                        <Button variant="primary">Filter</Button>
                    </InputGroup.Append>
                </InputGroup>
            </Form>
            <Row>
                {this.state.people
                    .filter((p) => this.filterFunc(p))
                    .filter((p) => this.searchFunc(p))
                    .sort((a, b) => this.state.sortFunc(a, b))
                    .map(p => <div className="col-md-3 p-1" key={p.uuid}><PersonCard person={p} link={true}/></div>)
                }
            </Row>
        </Container>
    }

    private filterChange(e: React.FormEvent<HTMLFormElement>) {
        let target = e.target as HTMLInputElement;
        let type = target.getAttribute('data-type');
        if (type === 'sort') {
            this.updateSort(target);
        } else if (type === 'filter') {
            this.updateFilter(target);
        } else if (type === 'search') {
            this.updateSearch(target);
        }
    }

    private updateFilter(target: HTMLInputElement) {
        let g = target.id;
        let filters = this.state.filters;
        if (!target.checked && filters.indexOf(g) !== -1) {
            filters = filters.filter((x) => x !== g);
            this.setState({filters});
        } else if (target.checked && filters.indexOf(g) === -1) {
            filters.push(g);
            this.setState({filters})
        }
    }

    private updateSort(target: HTMLInputElement) {
        let sort = target.id;
        switch (sort) {
            case "Birthday":
                this.setState({sortFunc: this.sortBirthday.bind(this), sort});
                break;
            case "Passing":
                this.setState({sortFunc: this.sortPassingDate.bind(this), sort});
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

    private updateSearch(target: HTMLInputElement) {
        let search = target.value;
        this.setState({search})
    }

    private sortBirthplace(p1: typePersonOverview, p2: typePersonOverview) {
        let a = (p1.birthplace || '').toLowerCase()
        let b = (p2.birthplace || '').toLowerCase()
        if (a === b) return this.sortName(p1, p2) * this.state.direction;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private sortPassingDate(p1: typePersonOverview, p2: typePersonOverview) {
        let date = new Date();
        let a = p1.passingDate || date;
        let b = p2.passingDate || date;
        let diff = a.getTime() - b.getTime();
        return diff !== 0 ? diff * this.state.direction : this.sortName(p1, p2) * this.state.direction;
    }

    private sortBirthday(p1: typePersonOverview, p2: typePersonOverview) {
        let a = p1.birthday;
        let b = p2.birthday;
        let diff = a.getTime() - b.getTime();
        return diff !== 0 ? diff * this.state.direction : this.sortName(p1, p2) * this.state.direction;
    }

    private sortGender(p1: typePersonOverview, p2: typePersonOverview) {
        let a = p1.gender.toLowerCase();
        let b = p2.gender.toLowerCase();
        if (a === b) return this.sortName(p1, p2) * this.state.direction;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private sortName(p1: typePersonOverview, p2: typePersonOverview) {
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

    private filterFunc(p: typePersonOverview): boolean {
        return this.state.filters.length === 0 || this.state.filters.indexOf(p.gender) !== -1;
    }

    private searchFunc(p: typePersonOverview): boolean {
        return this.state.search.length === 0 || p.name.toLowerCase().includes(this.state.search.toLowerCase());
    }
}

interface PeopleMap<T extends typePersonBase> {
    [key: string]: T;
}

export async function parsePeopleResults<T extends typePersonBase>(results: any): Promise<T[]> {
    let people = results.people.reduce((map: PeopleMap<T>, obj: T) => {
        map[obj.uuid] = obj;
        return map
    }, {});
    return await Promise.all<T>(results.people.map(async (p: any) => {
        p.birthday = new Date(p.birthday);
        p.passingDate = p.passingDate ? new Date(p.passingDate) : null;
        p.image = await getImage(p.uuid)
        p.parents = p.parents.map((id: string) => {
            return {id: id, name: people[id]?.name}
        });
        return p as T;
    }));
}