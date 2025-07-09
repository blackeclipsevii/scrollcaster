
const params = new URLSearchParams(window.location.search);
const rosterName = params.get('roster');
const regimentIndex = Number(params.get('regimentIndex'));
const army = params.get('army');
const type = params.get('type');

async function loadUnits() {
    const unitList = document.getElementById('unitList');
    const armyName = encodeURI(army);
    await fetch(`${hostname}:${port}/units?army=${armyName}`).
    then(resp => resp.json()).
    then(units => {
        units.forEach(unit => {
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
            points.textContent = '150 pts'; //`${unit.points} pts`;

            const addBtn = document.createElement('button');
            addBtn.classList.add('add-btn');
            addBtn.textContent = '+';
            addBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevents click from triggering page change
                const roster = await getRoster(rosterName);
                const regiment = roster.regiments[regimentIndex];
                regiment.units.push(unit);
                await putRoster(roster);
                goBack();
            });

            right.append(points, addBtn);
            item.append(left, right);
            unitList.appendChild(item);
        });
    });
}
loadUnits();