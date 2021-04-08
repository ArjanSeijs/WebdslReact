import '../stylesheets/style.css'

import React from "react";
import {
    Button,
    Card,
    Container,
    DropdownButton, Form,
    InputGroup,
    ListGroup,
    ListGroupItem,
    Row
} from "react-bootstrap";
import {Link} from "react-router-dom";

type familyOverviewFilter = {
    direction: 1 | -1;
    sort: string
    sortFunc: (a: PersonOverview, b: PersonOverview) => number;
    filters: string[]
    search: string;
};
type familyOverviewState = { people: PersonOverview[], name: string } & familyOverviewFilter;
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
            let people = await parsePeopleResults<PersonOverview>(result);
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
                    .map(p => <div className="col-md-3 p-1" key={p.uuid}><PersonCard person={p}/></div>)
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

    private sortBirthplace(p1: PersonOverview, p2: PersonOverview) {
        let a = (p1.birthplace || '').toLocaleLowerCase();
        let b = (p2.birthplace || '').toLocaleLowerCase();
        if (a === b) return this.sortName(p1, p2) * this.state.direction;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private sortPassingDate(p1: PersonOverview, p2: PersonOverview) {
        let date = new Date();
        let a = p1.passingDate || date;
        let b = p2.passingDate || date;
        let diff = a.getTime() - b.getTime();
        return diff !== 0 ? diff * this.state.direction : this.sortName(p1, p2) * this.state.direction;
    }

    private sortBirthday(p1: PersonOverview, p2: PersonOverview) {
        let a = p1.birthday;
        let b = p2.birthday;
        let diff = a.getTime() - b.getTime();
        return diff !== 0 ? diff * this.state.direction : this.sortName(p1, p2) * this.state.direction;
    }

    private sortGender(p1: PersonOverview, p2: PersonOverview) {
        let a = p1.gender.toLocaleLowerCase();
        let b = p2.gender.toLocaleLowerCase();
        if (a === b) return this.sortName(p1, p2) * this.state.direction;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private sortName(p1: PersonOverview, p2: PersonOverview) {
        let a = p1.name.toLocaleLowerCase();
        let b = p2.name.toLocaleLowerCase();
        if (a === b) return 0;
        else if (a < b) return -1 * this.state.direction;
        else return 1 * this.state.direction;
    }

    private toggleDir() {
        if (this.state.direction === 1) this.setState({direction: -1})
        else this.setState({direction: 1})
    }

    private filterFunc(p: PersonOverview): boolean {
        return this.state.filters.length === 0 || this.state.filters.indexOf(p.gender) !== -1;
    }

    private searchFunc(p: PersonOverview): boolean {
        return this.state.search.length === 0 || p.name.includes(this.state.search);
    }
}

export type PersonBase = { family: string; uuid: string, name: string, birthday: Date, gender: string, image: string };

type PersonRelation = { uuid: string, name: string };
type PersonData = { passingDate?: Date, birthplace?: string, parents: PersonRelation[] }
// type PersonOptionalData = { children: PersonRelation[], siblings: PersonRelation[], description?: string } & PersonData;

type PersonOverview = PersonBase & PersonData

function age(date: Date, birthday: Date) {
    let age = date.getFullYear() - birthday.getFullYear();
    if (date.getMonth() < birthday.getMonth()) {
        age--;
    } else if (date.getMonth() === birthday.getMonth() && date.getDate() < birthday.getDate()) {
        age--;
    }
    return age;
}

class PersonCard extends React.Component<{ person: PersonOverview }> {

    render() {
        let p = this.props.person;
        return <Card className="h-100">
            <Card.Img variant="top" className='user-image small' src={p.image ? p.image : "/FamilyTree/images/user-default.png"}/>
            <Card.Body className="p-0">
                <Card.Title className="p-3">{p.name}</Card.Title>
                <div className="card-text">
                    <ListGroup className="list-group-flush">
                        <hr/>
                        <PersonCardList faIcon="fas fa-venus-mars" value={p.gender}/>
                        <PersonCardList faIcon="fas fa-birthday-cake" value={p.birthday.toDateString()}/>
                        <PersonCardList faIcon="fas fa-cross" value={p.passingDate?.toDateString()} placeholder="Alive"/>
                        <PersonCardList faIcon="fas fa-city" value={p.birthplace} placeholder="Birthplace"/>
                        <PersonCardList faIcon="fas fa-calendar-alt" value={age(p.passingDate || new Date(), p.birthday) + " years"}/>
                        <PersonCardList faIcon="fas fa-user" value={p.parents[0]?.name} placeholder="Parent"/>
                        <PersonCardList faIcon="fas fa-user" value={p.parents[1]?.name} placeholder="Parent"/>
                        <ListGroupItem/>
                    </ListGroup>
                </div>
                <Link to={`/person/${p.uuid}`} className="stretched-link"/>
            </Card.Body>

        </Card>
    }
}

class PersonCardList extends React.Component<{ faIcon: string, value: string | undefined, placeholder?: string }> {
    render() {
        return <ListGroupItem>
            <div className="float-left"><i className={this.props.faIcon}/></div>
            <div className="float-right">{this.props.value ? this.props.value :
                <span className="text-muted">{this.props.placeholder}</span>}</div>
        </ListGroupItem>
    }
}

export async function parsePeopleResults<T extends PersonBase>(results: any): Promise<T[]> {
    return await Promise.all<T>(results.people.map(async (p: any) => {
        let image = await fetch(`/FamilyTree/getImageFile/${p.uuid}`)
        p.birthday = new Date(p.birthday);
        p.passingDate = p.passingDate ? new Date(p.passingDate) : null;
        p.image = window.URL.createObjectURL(await image.blob())
        return p as T;
    }));
}