
const params = new URLSearchParams(window.location.search);

function addItem(name, list, onclick) {
    const item = document.createElement('div');
    item.classList.add('selectable-item');

    // Clicking the container navigates to details
    item.addEventListener('click', onclick);

    const left = document.createElement('div');
    left.classList.add('selectable-item-left');
    left.textContent = name;

    const right = document.createElement('div');
    right.classList.add('selectable-item-right');

    item.append(left, right);
    list.appendChild(item);
}

async function loadArmies() {
    const coreList = document.getElementById('core-list');
    addItem('Age of Sigmar', coreList, () => {
        window.location.href = encodeURI(`tome.html`);
    });


    const url = `${endpoint}/armies`;
    await fetch(encodeURI(url)).
    then(resp => resp.json()).
    then(allArmies => {
        allArmies.forEach(army => {
            const armyList = document.getElementById('army-list');
            addItem(army, armyList, () => {
                window.location.href = encodeURI(`tome.html?army=${army}`);
            });
        });
    });
    loadScrollData();
}

loadArmies();
addOverlayListener();