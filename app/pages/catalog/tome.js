
const params = new URLSearchParams(window.location.search);
const armyName = params.get('army');

const makeItem = (name, onclick) => {
    const itemList = document.querySelector('.item-list');
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
    itemList.appendChild(item);
}

async function loadCore() {
    fixedPreviousUrl = encodeURI(`catalog.html`);
    const h2 = document.getElementById('army-name');
    h2.textContent = 'Age of Sigmar';

    makeItem('Warscrolls', () => {
        window.location.href = encodeURI(`../units/units.html`);
    });
    
    makeItem('Battle Tactic Cards', () => {
        window.location.href = encodeURI(`../tactics/tactics.html`);
    });          

    makeItem('Lores', () => {
        window.location.href = encodeURI(`../upgrades/upgrades.html?type=lore`);
    });   
}

async function loadTome() {
    fixedPreviousUrl = encodeURI(`catalog.html`);
    const url = `${endpoint}/armies?army=${armyName}`;
    await fetch(encodeURI(url)).
    then(resp => resp.json()).
    then(army => {
        const h2 = document.getElementById('army-name');
        h2.textContent = army.name;

        if (army.units) {
            makeItem('Warscrolls', () => {
                window.location.href = encodeURI(`../units/units.html?army=${armyName}`);
            });
        }

        if (army.upgrades.battleTraits) {
            makeItem('Battle Traits', () => {
                const names = Object.getOwnPropertyNames(army.upgrades.battleTraits);
                const traits = [];
                names.forEach(name => {
                    traits.push(army.upgrades.battleTraits[name]);
                })
                displayUpgradeOverlay(traits);
            });          
        }

        if (!army.isArmyOfRenown && army.upgrades.battleFormations) {
            makeItem('Battle Formations', () => {
                window.location.href = encodeURI(`../upgrades/upgrades.html?armyName=${armyName}&type=battleFormation`);
            });          
        }

        if (army.upgrades.artefacts) {
            makeItem('Artefacts of Power', () => {
                window.location.href = encodeURI(`../upgrades/upgrades.html?armyName=${armyName}&type=artefact`);
            });          
        }

        if (army.upgrades.heroicTraits) {
            makeItem('Heroic Traits', () => {
                window.location.href = encodeURI(`../upgrades/upgrades.html?armyName=${armyName}&type=heroicTrait`);
            });          
        }

        if (army.upgrades.lores.manifestation ||
            army.upgrades.lores.spell ||
            army.upgrades.lores.prayer) {
            makeItem('Lores', () => {
                window.location.href = encodeURI(`../upgrades/upgrades.html?armyName=${armyName}&type=lore`);
            });          
        }
    });
    loadScrollData();
}

if (armyName)
    loadTome();
else
    loadCore();
