
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
const armyName = params.get('army');
const displayLegends = params.get('legends');

const auxiliary = params.get('auxiliary');
const hasRegimentIndex = params.has('regimentIndex');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));

let type = params.get('type');
if (type)
    type = decodeURI(type);

function getUnitList(unit) {
    let unitList = null;
    if (unit.type === 0) {
        unitList = document.getElementById('hero-unit-list');
    } else if (unit.type == 1) {
        unitList = document.getElementById('infantry-unit-list');
    } else if (unit.type == 2) {
        unitList = document.getElementById('cavalry-unit-list');
    } else if (unit.type == 3) {
        unitList = document.getElementById('beast-unit-list');
    } else if (unit.type == 4) {
        unitList = document.getElementById('monster-unit-list');
    } else if (unit.type == 5) {
        unitList = document.getElementById('war-machine-unit-list');
    } else if (unit.type == 6) {
        unitList = document.getElementById('manifestation-unit-list');
    } else if (unit.type == 7) {
        unitList = document.getElementById('faction-terrain-unit-list');
    } else {
        // to-do fix manifestation unit type
        unitList = document.getElementById('manifestation-unit-list');
        // console.log(`unit type unknown: ${unit.name}`);
    }
    return unitList;
}

async function loadUnitsForCatalog() {
    let url = `${endpoint}/units`;
    if (armyName) {
        url = `${url}?army=${armyName}`
    }
    await fetch(encodeURI(url)).
    then(resp => resp.json()).
    then(units => {
        let unitIds = Object.getOwnPropertyNames(units);
        unitIds.forEach(id => {
            const unit = units[id];

            const item = document.createElement('div');
            item.classList.add('selectable-item');

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                const key = _inCatalog ? 'readMyScrollCat' : 'readMyScrollArmy';
                localStorage.setItem(key, JSON.stringify(unit));
                goTo(`../warscroll/warscroll.html?local=${key}`);
            });

            const unitList = getUnitList(unit);
            if (!unitList)
                return;

            const section = unitList.closest('.section');
            section.style.display = 'block';

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            left.textContent = unit.name;

            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            if (unit.points) {
                const points = document.createElement('span');
                points.className = 'points-label';
                points.textContent = unit.points ? `${unit.points} pts` : '';
                right.append(points);
            }
            item.append(left, right);
            unitList.appendChild(item);
        });
        loadScrollData();
    });
}

const getUnitCounts = () => {
    class ArmyUnitCounts {
        updateCount (unit) {
            let currentCount = this[unit.id]
            if (!currentCount)
                currentCount = 0;
            this[unit.id] = currentCount + 1;
        }
    };

    const armyUnitCounts = new ArmyUnitCounts();

    roster.regiments.forEach(reg =>{
        reg.units.forEach(unit =>{
            armyUnitCounts.updateCount(unit);
        });
    });

    roster.auxiliaryUnits.forEach(unit => {
        armyUnitCounts.updateCount(unit);
    });

    return armyUnitCounts;
}

async function loadUnits() {
    roster = await getRoster(rosterId);
    displayPointsOverlay(rosterId);
    refreshPointsOverlay(rosterId);
    updateValidationDisplay();

    const armyUnitCounts = getUnitCounts();

    const isNewRegiment = hasRegimentIndex && roster.regiments[regimentIndex].units.length === 0;

    const loadRor = async () => {
        await fetch(encodeURI(`${endpoint}/regimentsOfRenown?army=${roster.army}`)).
        then(resp => resp.json()).
        then(units => {
            units.forEach(regimentOfRenown => {
                const item = document.createElement('div');
                item.classList.add('selectable-item');

                // Clicking the container navigates to details
                item.addEventListener('click', () => {
                    displayUpgradeOverlay(regimentOfRenown.upgrades);
                });

                const unitList = document.getElementById('ror-unit-list');
                if (!unitList)
                    return;

                const section = unitList.closest('.section');
                section.style.display = 'block';

                const left = document.createElement('div');
                left.classList.add('selectable-item-left');
                
                const nameEle = document.createElement('p');
                nameEle.textContent = regimentOfRenown.name;
                nameEle.style.padding = '0px';
                nameEle.style.margin = '0px';
                left.appendChild(nameEle);

                const quantityEle = document.createElement('p');
                quantityEle.style.fontSize = '10px';
                quantityEle.className = 'ability-label';
                quantityEle.style.backgroundColor = 'rgb(0,0,0,0)';
                quantityEle.style.color = 'rgb(0,0,0,0)';
                left.appendChild(quantityEle);

                const updateCountDisplay = () => {
                    const count = armyUnitCounts[regimentOfRenown.id];
                    if (count) {
                        quantityEle.textContent = `${armyUnitCounts[regimentOfRenown.id]}x Regiment in Army`;
                        quantityEle.style.backgroundColor = 'grey';
                        quantityEle.style.color = 'white';
                        item.classList.remove('not-added');
                    } else {
                        quantityEle.textContent = 'None';
                        item.classList.add('not-added');
                    }
                }
                updateCountDisplay();

                const right = document.createElement('div');
                right.classList.add('selectable-item-right');

                const points = document.createElement('span');
                if (regimentOfRenown.points) {
                    points.className = 'points-label';
                    displayPoints(points, regimentOfRenown.points);
                }
                const addBtn = document.createElement('button');
                addBtn.classList.add('rectangle-button');
                addBtn.textContent = '+';
                addBtn.addEventListener('click', async (event) => {
                    event.stopPropagation(); // Prevents click from triggering page change
                    if (isNewRegiment) {
                        // we were making a new regiment but chose a ror
                        roster.regiments.splice(regimentIndex, 1);
                    }
                    roster.regimentOfRenown = regimentOfRenown;
                    await putRoster(roster);
                    goBack();
                });

                right.append(points, addBtn);
                item.append(left, right);
                unitList.appendChild(item);
            });
        });
    }

    if (isNewRegiment && !roster.regimentOfRenown) {
        // we could make the regiment a ror
        await loadRor();
    }

    let url = `${endpoint}/units?army=${roster.army}`;
    if (hasRegimentIndex){
        regiment = roster.regiments[regimentIndex];
        if (regiment.units.length > 0)
            url = `${url}&leaderId=${regiment.units[0].id}`;
    }
    await fetch(encodeURI(url)).
    then(resp => resp.json()).
    then(units => {
        const availableUnits = Object.values(units);
        availableUnits.forEach(unit => {
            if (unit._tags.length > 0) {
                console.log (`${unit.name} has tags: ${unit._tags.join(', ')}`);
            }
            if (!displayLegends && unit.keywords.includes('Legends'))
                return;

            if (type && !unit.keywords.includes(type.toUpperCase()))
                return;

            if (!type && unit.type > 5)
                return;

            if (isNewRegiment) {
                // cant lead without a profile
                if (!unit.battleProfile)
                    return;

                // the profile explicitly says they cannot lead
                if (unit.battleProfile.regimentOptions.toUpperCase() === 'NONE')
                    return;
            }

            const item = document.createElement('div');
            item.classList.add('selectable-item');

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                const key = _inCatalog ? 'readMyScrollCat' : 'readMyScrollArmy';
                localStorage.setItem(key, JSON.stringify(unit));
                goTo(`../warscroll/warscroll.html?local=${key}`);
            });

            const unitList = getUnitList(unit);
            if (!unitList)
                return;

            const section = unitList.closest('.section');
            section.style.display = 'block';

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');

            const nameEle = document.createElement('p');
            nameEle.textContent = unit.name;
            nameEle.style.padding = '0px';
            nameEle.style.margin = '0px';
            left.appendChild(nameEle);

            const quantityEle = document.createElement('p');
            quantityEle.style.fontSize = '10px';
            quantityEle.className = 'ability-label';
            quantityEle.style.backgroundColor = 'rgb(0,0,0,0)';
            quantityEle.style.color = 'rgb(0,0,0,0)';
            left.appendChild(quantityEle);

            const updateCountDisplay = () => {
                const count = armyUnitCounts[unit.id];
                if (count) {
                    quantityEle.textContent = `${armyUnitCounts[unit.id]}x Unit in Army`;
                    quantityEle.style.backgroundColor = 'grey';
                    quantityEle.style.color = 'white';
                    item.classList.remove('not-added');
                } else {
                    quantityEle.textContent = 'None';
                    item.classList.add('not-added');
                }
            }
            updateCountDisplay();

            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            const points = document.createElement('span');
            points.className = 'points-label';
            displayPoints(points, unit.points);

            const addBtn = document.createElement('button');
            addBtn.classList.add('rectangle-button');
            addBtn.textContent = '+';
            addBtn.addEventListener('click', async (event) => {
                event.stopPropagation(); // Prevents click from triggering page change
                if (auxiliary) {
                    roster.auxiliaryUnits.push(unit);
                } else if (unit.type == 7) {
                    roster.terrainFeature = unit;
                } else {
                    const regiment = roster.regiments[regimentIndex];
                    regiment.units.push(unit);
                }

                await putRoster(roster);
                if (isNewRegiment) {
                    goBack();
                } else {
                    armyUnitCounts.updateCount(unit);
                    updateCountDisplay();

                    totalPoints += unitTotalPoints(unit);
                    refreshPointsOverlay(roster.id);
                    updateValidationDisplay();
                }
            });

            right.append(points, addBtn);
            item.append(left, right);
            unitList.appendChild(item);
        });
        loadScrollData();
    });
}

addOverlayListener();

if (rosterId) {
    loadUnits();
} else {
    let url = `../catalog/tome.html?loadScrollData=true`;
    if (armyName) {
        url = `${url}&army=${armyName}`
    }
    loadUnitsForCatalog();
}