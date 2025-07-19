
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

function canFieldUnit(regimentOptions, unit) {
    // is the unit literally called out?
    for (let i = 0; i < regimentOptions.units.length; ++i) {
        if (regimentOptions.units[i] === unit.id) {
            return true;
        }
    }

    // does the unit match keywords?
    for (let i = 0; i < regimentOptions.keywords.length; ++i) {
        if (unit.keywords.includes(regimentOptions.keywords[i]) &&
            unit.type > 0) {
            return true;
        }
    }

    // does the unit match some kind of logic keyword?
    for (let i = 0; i < regimentOptions._tags.length; ++i) {
        if (unit._tags.includes(regimentOptions._tags[i])) {
            return true;
        }
    }

}

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
                const key = 'readMyScroll';
                localStorage.setItem(key, JSON.stringify(unit));
                window.location.href = `../warscroll/warscroll.html?local=${key}`;
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

            const points = document.createElement('span');
            points.textContent = unit.points ? `${unit.points} pts` : '';

            right.append(points);
            item.append(left, right);
            unitList.appendChild(item);
        });
    });
    loadScrollData();
}

async function loadUnits() {
    roster = await getRoster(rosterId);
    displayPointsOverlay(rosterId);
    refreshPointsOverlay(rosterId);
    updateValidationDisplay();

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
                left.textContent = regimentOfRenown.name;

                const right = document.createElement('div');
                right.classList.add('selectable-item-right');

                const points = document.createElement('span');
                points.textContent = regimentOfRenown.points ? `${regimentOfRenown.points} pts` : '';

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

    if (isNewRegiment && !roster.regimentOfRenown && !roster.isArmyOfRenown) {
        // we could make the regiment a ror
        await loadRor();
    }

    await fetch(encodeURI(`${endpoint}/units?army=${roster.army}`)).
    then(resp => resp.json()).
    then(units => {
        let leader = null;
        let unitIds = Object.getOwnPropertyNames(units);
        let useRegimentOptions = false;
        if (hasRegimentIndex){
            regiment = roster.regiments[regimentIndex];
            if (regiment.units.length > 0 && regiment.units[0].regimentOptions) {
                useRegimentOptions = true;
                leader = regiment.units[0];
            }
        }
        unitIds.forEach(id => {
            const unit = units[id];
            if (!displayLegends && unit.keywords.includes('Legends'))
                return;

            if (type && !unit.keywords.includes(type.toUpperCase()))
                return;

            if (!type && unit.type > 5)
                return;

            if (useRegimentOptions && !canFieldUnit(leader.regimentOptions, unit))
                return;

            const item = document.createElement('div');
            item.classList.add('selectable-item');

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                const key = 'readMyScroll';
                localStorage.setItem(key, JSON.stringify(unit));
                window.location.href = `../warscroll/warscroll.html?local=${key}`;
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

            const points = document.createElement('span');
            points.textContent = unit.points ? `${unit.points} pts` : '';

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
                goBack();
                // window.location.href = `../army/army.html?id=${rosterId}`;
            });

            right.append(points, addBtn);
            item.append(left, right);
            unitList.appendChild(item);
        });
    });
    loadScrollData();
}

addOverlayListener();

if (rosterId) {
    fixedPreviousUrl = encodeURI(`../army/army.html?id=${rosterId}`);
    loadUnits();
} else {
    let url = `../catalog/tome.html`;
    if (armyName) {
        url = `${url}?army=${armyName}`
    }
    fixedPreviousUrl = encodeURI(url);
    loadUnitsForCatalog();
}