
const params = new URLSearchParams(window.location.search);

async function loadArmies() {
    const url = `${hostname}:${port}/armies`;
    await fetch(encodeURI(url)).
    then(resp => resp.json()).
    then(allArmies => {
        allArmies.forEach(army => {
            const armyList = document.getElementById('army-list');

            const item = document.createElement('div');
            item.classList.add('selectable-item');

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                console.log(army);
                window.location.href = encodeURI(`../units/units.html?army=${army}`);
            });

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            left.textContent = army;

            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            item.append(left, right);
            armyList.appendChild(item);
        });
    });
    loadScrollData();
}

loadArmies();
addOverlayListener();