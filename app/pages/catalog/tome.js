
const params = new URLSearchParams(window.location.search);
const armyName = params.get('army');

const makeItem = (name, onclick, listName = 'item-list') => {
    const itemList = document.querySelector(`.${listName}`);
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
    const h2 = document.getElementById('army-name');
    h2.textContent = 'Age of Sigmar';

    makeItem('Warscrolls', () => {
        goTo(encodeURI(`../units/units.html`));
    });
    
    makeItem('Battle Tactic Cards', () => {
        goTo(encodeURI(`../tactics/tactics.html`));
    });          

    makeItem('Lores', () => {
        goTo(encodeURI(`../upgrades/upgrades.html?type=lore`));
    });
}

async function loadRor() {
    const h2 = document.getElementById('army-name');
    h2.textContent = 'Regiments of Renown';

    await fetch(encodeURI(`${endpoint}/regimentsOfRenown`)).
    then(resp => resp.json()).
    then(unitsLUT => {
        const units = Object.values(unitsLUT);
        units.forEach(regimentOfRenown => {
            makeItem(regimentOfRenown.name, () => {
                displayUpgradeOverlay(regimentOfRenown.upgrades);
            });
        });
    });
}

async function loadTome(doSub = true) {
    const h2 = document.getElementById('army-name');
    h2.textContent = armyName;

    const _loadFaction = async (subFactionName) => {
        const url = `${endpoint}/armies?army=${subFactionName}`;
        await fetch(encodeURI(url)).
        then(resp => resp.json()).
        then(army => {            
            const itemList = document.querySelector(`.item-list`);
            itemList.innerHTML = '';
            const h2 = document.getElementById('army-name');
            h2.textContent = army.name;

            if (army.units) {
                makeItem('Warscrolls', () => {
                    goTo(encodeURI(`../units/units.html?army=${subFactionName}`));
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
                    goTo(encodeURI(`../upgrades/upgrades.html?armyName=${subFactionName}&type=battleFormation`));
                });          
            }

            if (army.upgrades.artefacts) {
                makeItem('Artefacts of Power', () => {
                    goTo(encodeURI(`../upgrades/upgrades.html?armyName=${subFactionName}&type=artefact`));
                });          
            }

            if (army.upgrades.heroicTraits) {
                makeItem('Heroic Traits', () => {
                    goTo(encodeURI(`../upgrades/upgrades.html?armyName=${subFactionName}&type=heroicTrait`));
                });          
            }

            if (Object.getOwnPropertyNames(army.upgrades.lores.manifestation).length > 6 ||
                getarmy.upgrades.lores.spell ||
                army.upgrades.lores.prayer) {
                makeItem('Lores', () => {
                    goTo(encodeURI(`../upgrades/upgrades.html?armyName=${subFactionName}&type=lore`));
                });          
            }
        });
    }

    if (doSub) {
        const subfactions = [];
        await fetchArmies(async (allArmies) => {
            allArmies.forEach(army => {
                if (army.includes(armyName)) {
                    subfactions.push(army);
                }
            });

            if (subfactions.length > 1) {
                 subfactions.every(army => {
                    if (!army.includes(' - ')) {
                        makeItem(armyName, () => {
                            goTo(encodeURI(`tome.html?army=${armyName}&loadScrollData=true`), false);
                            _loadFaction(armyName);
                        });
                        return false;
                    }
                    return true;
                });

                subfactions.forEach(army => {
                    if (army.includes(' - ')) {
                        makeItem(army.split(' - ')[1], () => {
                            goTo(encodeURI(`tome.html?army=${army}&loadScrollData=true`), false);
                            _loadFaction(army);
                        });
                    }
                });
                
                loadScrollData();
            } else {
                _loadFaction(armyName);
                loadScrollData();   
            }
        });

        return;
    }
}

if (armyName)
    armyName === 'ror' ? loadRor() : loadTome();
else
    loadCore();