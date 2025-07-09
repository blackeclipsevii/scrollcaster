
const host = 'http://localhost';
const port = 3000;

const params = new URLSearchParams(window.location.search);
const army = params.get('army');
const type = params.get('type');

async function loadUnits() {
    const unitList = document.getElementById('unitList');
    const armyName = encodeURI(army);
    await fetch(`${host}:${port}/units?army=${armyName}`).
    then(resp => resp.json()).
    then(units => {
        units.forEach(unit => {
            if (type && !unit.keywords.includes(type.toUpperCase())) {
                console.log(unit.keywords);
                return;
            }

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
            addBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevents click from triggering page change
                alert(`Added ${unit.name} to your army!`);
            });

            right.append(points, addBtn);
            item.append(left, right);
            unitList.appendChild(item);
        });
    });
}
loadUnits();

function goBack() {
    window.history.back();
}