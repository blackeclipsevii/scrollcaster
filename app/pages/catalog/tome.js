
const params = new URLSearchParams(window.location.search);
let armyName = params.get('army');
let core = params.get('core');

const coreVisible = (visible) => {
    const bb = document.querySelector('.back-btn');
    bb.style.display = visible ? 'none' : '';

    const sec = document.getElementById('core-section');
    sec.style.display = visible ? '' : 'none';
}

const resetLists = () => {
    const lists = document.querySelectorAll('.item-list');
    lists.forEach(l => l.innerHTML = '');
}

const makeItem = (name, onclick, listName = 'army-list', points=null) => {
    const itemList = document.getElementById(listName);
    const item = document.createElement('div');
    item.classList.add('selectable-item');

    // Clicking the container navigates to details
    item.addEventListener('click', onclick);

    const left = document.createElement('div');
    left.classList.add('selectable-item-left');
    left.textContent = name;

    const right = document.createElement('div');
    right.classList.add('selectable-item-right');
    
    if (points) {
        const pts = document.createElement('span');
        pts.className = 'points-label';
        displayPoints(pts, points);
        right.append(pts);
    }

    item.append(left, right);
    itemList.appendChild(item);
}

async function loadCore() {
    coreVisible(false);
    resetLists();
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
    coreVisible(false);
    resetLists();
    const h2 = document.getElementById('army-name');
    h2.textContent = 'Regiments of Renown';

    await fetch(encodeURI(`${endpoint}/regimentsOfRenown`)).
    then(resp => resp.json()).
    then(unitsLUT => {
        const units = Object.values(unitsLUT);
        units.forEach(regimentOfRenown => {
            makeItem(regimentOfRenown.name, () => {
                displayUpgradeOverlay(regimentOfRenown.upgrades);
            }, 'item-list', regimentOfRenown.points);
        });
    });
}

async function loadTome(doSub = true) {
    coreVisible(false);
    resetLists();
    const h2 = document.getElementById('army-name');
    h2.textContent = armyName;

    const _loadFaction = async (subFactionName) => {
        resetLists();
        const url = `${endpoint}/armies?army=${subFactionName}`;
        await fetch(encodeURI(url)).
        then(resp => resp.json()).
        then(army => {            
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
                army.upgrades.lores.spell ||
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
                            goTo(encodeURI(`/pages/catalog/tome.html?army=${armyName}&loadScrollData=true`), false);
                            _loadFaction(armyName);
                        });
                        return false;
                    }
                    return true;
                });

                subfactions.forEach(army => {
                    if (army.includes(' - ')) {
                        makeItem(army.split(' - ')[1], () => {
                            goTo(encodeURI(`/pages/catalog/tome.html?army=${army}&loadScrollData=true`), false);
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

async function loadArmies() {
    coreVisible(true);
    const h2 = document.getElementById('army-name');
    h2.textContent = 'Armies';

    makeItem('Age of Sigmar', () => {
        goTo(encodeURI(`/pages/catalog/tome.html?core=true`), false);
        coreVisible(false);
        resetLists();
        core = true;
        armyName = null;
        loadCore();
    }, 'core-list');
    
    makeItem('Regiments of Renown', () => {
        goTo(encodeURI(`/pages/catalog/tome.html?army=ror`), false);
        coreVisible(false);
        resetLists();
        core = false;
        armyName = null;
        loadRor();
    }, 'core-list');

    const loader = document.getElementById('loader-box');
    loader.style.display = 'block';
    await fetchArmies(async (allArmies) => {
        loader.style.display = 'none';
        allArmies.forEach(army => {
            if (army.includes(' - '))
                return;

            makeItem(army, () => {
                goTo(encodeURI(`/pages/catalog/tome.html?army=${army}`), false);
                coreVisible(false);
                resetLists();
                core = false;
                armyName = army;
                loadTome();
            }, 'army-list');
        });
        
        loadScrollData();
    });
}

if (armyName)
    armyName === 'ror' ? loadRor() : loadTome();
else if (core)
    loadCore();
else
    loadArmies();