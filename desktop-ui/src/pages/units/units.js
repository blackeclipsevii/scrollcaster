
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
const auxiliary = params.get('auxiliary');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));
const army = params.get('army');
const type = params.get('type');

async function loadUnits() {
    const roster = await getRoster(rosterId);
    const unitList = document.getElementById('unitList');
    const armyName = encodeURI(army);
    await fetch(`${hostname}:${port}/units?army=${armyName}`).
    then(resp => resp.json()).
    then(units => {
        const unitIds = Object.getOwnPropertyNames(units);
        unitIds.forEach(id => {
            const unit = units[id];
            if (type && !unit.keywords.includes(type.toUpperCase()))
                return;

            if (unit.type > 5)
                return;

            const item = document.createElement('div');
            item.classList.add('unit-item');

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                window.location.href = `../warscroll/warscroll.html?army=${armyName}&unit=${unit.name}`;
            });

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
}
loadUnits();