
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
const displayLegends = params.get('legends');
fixedPreviousUrl = encodeURI(`../army/army.html?id=${rosterId}`);

const auxiliary = params.get('auxiliary');
const hasRegimentIndex = params.has('regimentIndex');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));

let type = params.get('type');
if (type)
    type = decodeURI(type);

function canFieldUnit(regimentOptions, unit) {
    for (let i = 0; i < regimentOptions.units.length; ++i) {
        if (regimentOptions.units[i] === unit.id) {
            return true;
        }
    }

    for (let i = 0; i < regimentOptions.keywords.length; ++i) {
        if (unit.keywords.includes(regimentOptions.keywords[i]) &&
            unit.type > 0) {
            return true;
        }
    }

    for (let i = 0; i < regimentOptions.armyKeywords.length; ++i) {
        if (unit.keywords.includes(regimentOptions.armyKeywords[i])) {
            return true;
        }
    }

}

async function loadUnits() {
    roster = await getRoster(rosterId);

    await fetch(encodeURI(`${hostname}:${port}/units?army=${roster.army}`)).
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
                window.location.href = `../warscroll/warscroll.html?army=${roster.army}&unit=${unit.name}`;
            });

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
                console.log(`unit type unknown: ${unit.name}`);
                return;
            }

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
            addBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevents click from triggering page change
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

loadUnits();