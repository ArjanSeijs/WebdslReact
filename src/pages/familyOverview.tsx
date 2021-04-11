import '../stylesheets/style.css'

import React from "react";
import {Button, Container, DropdownButton, Form, InputGroup, Row} from "react-bootstrap";
import {typePersonBase, PersonCard, typePerson, parsePersonResults} from "./personOverview";
import {AuthenticationState, rejected} from "./authencation";
import {observer} from "mobx-react";
import {toHashMap} from "./util";

/** Represents min and max values of the birthday and passingdate filters and step value*/
type typeDateFilter = { min: number, minValue: number, max: number, maxValue: number, stepValue: number };
/** direction : sort ascending or descending, sortFunc : comparator, genders : the genders to display, search : users to filter, dates : selection for dates values*/
type typeFilterState = {
    loaded : boolean,
    direction: 1 | -1,
    sort: string,
    sortFunc: (a: typePerson, b: typePerson) => number,
    genders: string[],
    status: { alive: boolean, deceased: boolean },
    search: string,
    dates: { birthday: typeDateFilter, passingdate: typeDateFilter }
};
/** List of people and name of this family tree and username of the owner. */
type typeFamilyState = { people: typePerson[], name: string, owner: string };

/** {@see FamilyOverview}*/
type familyOverviewState = typeFamilyState & typeFilterState;
/** {@see FamilyOverview}*/
type familyOverviewType = { uuid: string };

/**
 * Component that displays all people in this tree and options for filtering & sorting them
 */
@observer
export class FamilyOverview extends React.Component<familyOverviewType, familyOverviewState> {

    constructor(props: familyOverviewType) {
        super(props);
        let sortFunc = this.sortName.bind(this);

        // Initial state
        let filters: string[] = [];
        let alive = {alive: false, deceased: false}
        let year = new Date().getFullYear();
        let dates = {min: year - 2, max: year + 1, minValue: year - 2, maxValue: year + 1, stepValue: 1};
        this.state = {
            loaded : false,
            people: [],
            direction: 1,
            sort: 'Name',
            genders: filters,
            status: alive,
            search: '',
            sortFunc,
            name: '',
            owner: '',
            dates: {birthday: dates, passingdate: dates}
        };
    }

    /**
     * Retrieves all the people in this family and transforms it using {@link parsePeopleResults}
     * Then updates the filters
     */
    async fetchPeople() {
        let response = await fetch(`/FamilyTree/user_people/${this.props.uuid}`);
        if (response.ok) {
            let result = await response.json();
            let people = await parsePeopleResults<typePerson>(result);
            this.setState({people: people, name: result.name, owner: result.owner, loaded : true})

            // If we found people parse it
            if (people.length > 0) {
                let now = new Date();
                let birthday = people.map(p => p.birthday.getFullYear())
                let passingdate = people.map(p => p.passingdate?.getFullYear() || now.getFullYear());
                this.parseDays(birthday, passingdate, now);
            }
        }
    }

    /**
     * Determine a scale depended on the difference so that the selection
     * @param max
     * @param min
     * @private
     */
    private getStepValue(max: number, min: number): number {
        if (max - min <= 20) {
            return 1;
        }
        if (max - min <= 100) {
            return 5;
        }
        if (max - min <= 200) {
            return 10;
        }
        if (max - min <= 400) {
            return 20;
        }
        return 50;
    }

    /**
     *
     * @param birthday
     * @param passingdate
     * @param now
     * @private
     */
    private parseDays(birthday: number[], passingdate: number[], now: Date) {
        let minBday = Math.min(...birthday);
        let minPday = Math.min(...passingdate);
        let year = now.getFullYear();
        let bdayScale = this.getStepValue(year, minBday);
        let pdayScale = this.getStepValue(year, minPday);

        let birthdayMinValue = Math.floor(minBday / bdayScale) * bdayScale;
        let birthdayMaxValue = Math.ceil(year / bdayScale) * bdayScale;
        let passingdateMinValue = Math.floor(minPday / pdayScale) * pdayScale;
        let passingdateMaxValue = Math.ceil(year / pdayScale) * pdayScale;

        if (bdayScale === 1) birthdayMaxValue++;
        if (pdayScale === 1) passingdateMaxValue++;

        let dates = {
            birthday: {min: birthdayMinValue, max: birthdayMaxValue, minValue: birthdayMinValue, maxValue: birthdayMaxValue, stepValue: bdayScale},
            passingdate: {min: passingdateMinValue, max: passingdateMaxValue, minValue: passingdateMinValue, maxValue: passingdateMaxValue, stepValue: pdayScale}
        }
        console.log(dates)
        this.setState({dates})
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
            if (!response.ok) throw new Error(response.statusText);
            this.setState({name: newName})
        }
    }

    render() {
        let editable = this.state.owner === AuthenticationState.instance.username && AuthenticationState.instance.isLoggedIn();
        return <Container className="p-2">
            <h1>{this.state.name + ' '}
                {!editable ? null : <sup><Button size={"sm"} variant="outline-secondary" onClick={() => this.editName().catch(rejected)}><i
                    className="fas fa-pencil-alt"/></Button></sup>}
            </h1>
            <Form onChange={(e) => this.filterChange(e)}>
                <InputGroup>
                    <Form.Control placeholder="Search" aria-label="search" aria-describedby="basic-addon2" data-type='search'/>
                    <DropdownButton className='w-auto' as={InputGroup.Append} variant="secondary" title="Date" id="input-group-dropdown-filter">
                        {this.renderDateSelect()}
                    </DropdownButton>
                    <DropdownButton as={InputGroup.Append} className="border-right" variant="secondary" title="Filter" id="input-group-dropdown-filter">
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

                        <Button variant="primary" onClick={this.toggleDir.bind(this)}>
                            {(() => {
                                let sort = this.state.sort;
                                let direction = this.state.direction;
                                if (sort === 'Name' || sort === 'Birthplace' || sort === 'Gender')
                                    return direction === 1 ? <i className="fas fa-sort-alpha-up"/> : <i className="fas fa-sort-alpha-down"/>
                                return direction === 1 ? <i className="fas fa-sort-amount-up-alt"/> : <i className="fas fa-sort-amount-down-alt"/>
                            })()}
                        </Button>
                    </InputGroup.Append>
                    {!editable ? null :
                        <InputGroup.Append>
                            <Button variant="success" onClick={() => this.newPerson().catch(rejected)}><i className="fas fa-user-plus"/> </Button>
                        </InputGroup.Append>}
                </InputGroup>
            </Form>
            <Row>
                {!this.state.loaded ? <div>Loading ... </div> :
                    this.state.people
                        .filter((p) => this.filterFunc(p))
                        .filter((p) => this.searchFunc(p))
                        .sort((a, b) => this.state.sortFunc(a, b))
                        .map(p => <div className="col-md-3 p-1" key={p.uuid}><PersonCard person={p} link={true}/></div>)
                }
            </Row>
        </Container>
    }

    private renderDateSelect() {
        return <div className={"p-2 w-100"}>
            <InputGroup>
                <InputGroup.Prepend> <InputGroup.Text>
                    <i className="fa fa-chevron-left"/><i className="fa fa-birthday-cake"/>
                </InputGroup.Text></InputGroup.Prepend>
                <Form.Control as='select' value={this.state.dates.birthday.minValue} onChange={this.updateDates.bind(this)} data-type={"date"} id={"minBday"}>
                    {this.dates(this.state.dates.birthday, false).map((year) => <option value={year} key={"min" + year}>{year}</option>)}
                </Form.Control>
            </InputGroup>
            <InputGroup>
                <Form.Control as='select' value={this.state.dates.birthday.maxValue} onChange={this.updateDates.bind(this)} data-type={"date"} id={"maxBday"}>
                    {this.dates(this.state.dates.birthday, true).map((year) => <option value={year} key={"max" + year}>{year}</option>)}
                </Form.Control>
                <InputGroup.Append> <InputGroup.Text>
                    <i className="fa fa-birthday-cake"/><i className="fa fa-chevron-right"/>
                </InputGroup.Text></InputGroup.Append>
            </InputGroup>
            <InputGroup>
                <InputGroup.Prepend> <InputGroup.Text>
                    <i className="fa fa-chevron-left"/><i className="fa fa-cross"/>
                </InputGroup.Text></InputGroup.Prepend>
                <Form.Control as='select' value={this.state.dates.passingdate.minValue} onChange={this.updateDates.bind(this)} data-type={"date"}
                              id={"minPday"}>
                    {this.dates(this.state.dates.passingdate, false).map((year) => <option value={year} key={"min" + year}>{year}</option>)}
                </Form.Control>
            </InputGroup>
            <InputGroup>
                <Form.Control as='select' value={this.state.dates.passingdate.maxValue} onChange={this.updateDates.bind(this)} data-type={"date"}
                              id={"maxPday"}>
                    {this.dates(this.state.dates.passingdate, true).map((year) => <option value={year} key={"max" + year}>{year}</option>)}
                </Form.Control>
                <InputGroup.Append> <InputGroup.Text>
                    <i className="fa fa-cross"/><i className="fa fa-chevron-right"/>
                </InputGroup.Text></InputGroup.Append>
            </InputGroup>
        </div>
    }

    /**
     * Gets array with all the dates based on the min, max and stepValue
     * @param date
     * @param max
     * @private
     */
    private dates(date: typeDateFilter, max: boolean): number[] {
        let numbers = [];
        for (let i = date.min; i < date.max; i += date.stepValue) {
            numbers.push(i + (max ? date.stepValue : 0));
        }
        return numbers;
    }

    /**
     * Make a request to a create a new person and rederict to its edit page on succes
     * @private
     */
    private async newPerson() {
        let response = await fetch(`/FamilyTree/user_newPerson/${this.props.uuid}`, {method: 'POST'});
        if (!response.ok) throw new Error(response.statusText);
        let json = await response.json();
        let uuid = json.uuid;
        window.location.pathname = `/person_edit/${uuid}`
    }


    /**
     *  We update the filters on form value changes
     * @param e
     * @private
     */
    private filterChange(e: React.FormEvent<HTMLFormElement>) {
        let target = e.target as HTMLElement;
        let type = target.getAttribute('data-type');
        if (type === 'sort') {
            this.updateSort(target as HTMLInputElement);
        } else if (type === 'filter-gender') {
            this.updateGenderFilter(target as HTMLInputElement);
        } else if (type === 'filter-alive') {
            this.updateAliveFilter(target as HTMLInputElement);
        } else if (type === 'search') {
            this.updateSearch(target as HTMLInputElement);
        }
    }

    /**
     * Update the filter values of the dates
     * We always want min to be less than max (and vice versa)
     * @param e
     * @private
     */
    private updateDates(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        let target = e.target as HTMLSelectElement;
        let id = target.id;
        this.setState(prev => {
            // Keep track of old state
            let passingdate: typeDateFilter = {...prev.dates.passingdate};
            let birthday: typeDateFilter = {...prev.dates.birthday}
            // Update depenedent on the input
            if (id === "minBday") {
                birthday.minValue = parseInt(target.value);
                birthday.maxValue = Math.max(birthday.minValue + birthday.stepValue, birthday.maxValue)
            } else if (id === "maxBday") {
                birthday.maxValue = parseInt(target.value);
                birthday.minValue = Math.min(birthday.maxValue - birthday.stepValue, birthday.minValue)
            } else if (id === "minPday") {
                passingdate.minValue = parseInt(target.value);
                passingdate.maxValue = Math.max(passingdate.minValue + passingdate.stepValue, passingdate.maxValue)
            } else if (id === "maxPday") {
                passingdate.maxValue = parseInt(target.value);
                passingdate.minValue = Math.min(passingdate.maxValue - passingdate.stepValue, passingdate.minValue)
            }
            return {dates: {passingdate, birthday}}
        });
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

        let passingdate = p.passingdate || new Date();
        let correctBirthday = p.birthday.getFullYear() >= this.state.dates.birthday.minValue && p.birthday.getFullYear() < this.state.dates.birthday.maxValue;
        let correctPassingdate = passingdate.getFullYear() >= this.state.dates.passingdate.minValue && passingdate.getFullYear() < this.state.dates.passingdate.maxValue;

        return gender && (statusSelected || statusCorrect) && correctBirthday && correctPassingdate;
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