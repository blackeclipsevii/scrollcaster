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
        goTo(encodeURI(`tome.html`));
    });
    
    addItem('Regiments of Renown', coreList, () => {
        goTo(encodeURI(`tome.html?army=ror`));
    });

    const loader = document.getElementById('loader-box');
    loader.style.display = 'block';
    await fetchArmies(async (allArmies) => {
        loader.style.display = 'none';
        allArmies.forEach(army => {
            if (army.includes(' - '))
                return;
            const armyList = document.getElementById('army-list');
            addItem(army, armyList, () => {
                goTo(encodeURI(`tome.html?army=${army}`));
            });
        });
        
        loadScrollData();
    });
}

loadArmies();
// addOverlayListener();