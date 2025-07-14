
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
const auxiliary = params.get('auxiliary');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));

let type = params.get('type');
if (type)
    type = decodeURI(type);

async function loadUnits() {
    const roster = await getRoster(rosterId);
    await fetch(encodeURI(`${hostname}:${port}/units?army=${roster.army}`)).
    then(resp => resp.json()).
    then(units => {
        const unitIds = Object.getOwnPropertyNames(units);
        unitIds.forEach(id => {
            const unit = units[id];
            if (type && !unit.keywords.includes(type.toUpperCase()))
                return;

            if (!type && unit.type > 5)
                return;

            const item = document.createElement('div');
            item.classList.add('unit-item');

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
            left.classList.add('unit-left');
            left.textContent = unit.name;

            const right = document.createElement('div');
            right.classList.add('unit-right');

            const points = document.createElement('span');
            points.textContent = unit.points ? `${unit.points} pts` : '';

            const addBtn = document.createElement('button');
            addBtn.classList.add('add-btn');
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