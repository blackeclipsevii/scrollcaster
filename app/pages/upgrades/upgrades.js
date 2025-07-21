
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
const armyName = params.get('armyName');

const auxiliary = params.get('auxiliary');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));

let type = params.get('type');
if (type)
    type = decodeURI(type) + 's';

const isLore = type && type.toLowerCase().includes('lore')

function getList(upgrade) {
    let upgradeList = null;
    if (upgrade.type === 0) {
        upgradeList = document.getElementById('artefact-list');
    } else if (upgrade.type === 1) {
        upgradeList = document.getElementById('trait-list');
    } else if (upgrade.type === 2) {
        upgradeList = document.getElementById('formation-list');
    } else if (upgrade.type === 3) {
        upgradeList = document.getElementById('spell-list');
    } else if (upgrade.type === 6) {
        upgradeList = document.getElementById('prayer-list');
    }else if (upgrade.type === 4) {
        upgradeList = document.getElementById('manifestation-list');
    } else {
        console.log(`type unknown: ${upgrade.name}`);
        document.querySelector('.item-list');
    }
    return upgradeList;
}

function isUniversal(str) {
    return str.startsWith("UNIVERSAL-");
}

function displayUpgrade(upgrade) {
    let upgradeList = getList(upgrade);

    const section = upgradeList.closest('.section');
    section.style.display = 'block';

    const item = document.createElement('div');
    item.classList.add('selectable-item');

    // Clicking the container navigates to details
    item.addEventListener('click', () => {
        displayUpgradeOverlay(upgrade);
    });

    const left = document.createElement('div');
    left.classList.add('selectable-item-left');
    left.textContent = upgrade.name;

    const right = document.createElement('div');
    right.classList.add('selectable-item-right');

    const points = document.createElement('span');
    points.textContent = upgrade.points ? `${upgrade.points} pts` : '';

    if (rosterId) {
        const addBtn = document.createElement('button');
        addBtn.classList.add('rectangle-button');
        addBtn.textContent = '+';
        addBtn.addEventListener('click', async (e) => {
            e.stopPropagation(); // Prevents click from triggering page change
            if (type.includes('battleFormation')) {
                roster.battleFormation = upgrade;
            } else if (type.includes('tactic')) {
                roster.battleTacticCards.push(upgrade);
            } else if (upgrade.type == 3) {
                roster.lores.spell = upgrade;   
            } else if (upgrade.type == 4) {
                roster.lores.manifestation = upgrade;
            } else if (upgrade.type == 6) {
                roster.lores.prayer = upgrade;
            }
            await putRoster(roster);
            goBack();
            // window.location.href = `../army/army.html?id=${rosterId}`;
        });

        right.append(points, addBtn);
    } else {
        right.append(points);
    }
    item.append(left, right);
    upgradeList.appendChild(item);
}

function displayUpgrades(upgradeList) {
    upgradeList.forEach(upgrades => {
        let upgradeNames = Object.getOwnPropertyNames(upgrades);
        if (isLore) {
            if (rosterId) {
                upgradeNames = upgradeNames
                                .sort((a, b) => {
                                    // Prioritize non-UNIVERSAL strings
                                    const aIsUniversal = isUniversal(a);
                                    if (aIsUniversal !== isUniversal(b)) {
                                        return aIsUniversal ? 1 : -1;
                                    }
                                    // Sort alphabetically within each group
                                    return a.localeCompare(b);
                                });
            } else if (armyName) {
                upgradeNames = upgradeNames.filter(name => !isUniversal(name));
            }
        }
        upgradeNames.forEach(upgradeName => {
            const upgrade = upgrades[upgradeName];
            displayUpgrade(upgrade);
        });
    });
}

async function loadUpgradesCatalog() {
    fixedPreviousUrl = encodeURI(`../catalog/tome.html?army=${armyName}`);
    await fetchWithRetry(encodeURI(`${endpoint}/upgrades?army=${armyName}`)).
    then(resp => resp.json()).
    then(allUpgrades => {
        let upgradeList = [];
        if (isLore) {
            // to-do add a header to label these seperately
            upgradeList = [];

            const loreNames = Object.getOwnPropertyNames(allUpgrades.lores);
            loreNames.forEach(loreName => {
                upgradeList.push(allUpgrades.lores[loreName]);
            });

        } else {
            upgradeList = [allUpgrades[type]];
        }
        
        displayUpgrades(upgradeList);
    });
    loadScrollData();
}

async function loadUniversalLores() {
    fixedPreviousUrl = encodeURI(`../catalog/tome.html`);
    await fetchWithRetry(encodeURI(`${endpoint}/lores`)).
    then(resp => resp.json()).
    then(loreObject => {
        loreObject.universal.forEach(ulut => {
            const lore = loreObject.lores.manifestation[ulut.id];
            displayUpgrade(lore);
        });
    });
    loadScrollData();
}

async function loadUpgrades() {
    fixedPreviousUrl = encodeURI(`../army/army.html?id=${rosterId}`);
    roster = await getRoster(rosterId);
    displayPointsOverlay(rosterId);
    refreshPointsOverlay(rosterId);
    updateValidationDisplay();

    await fetchWithRetry(encodeURI(`${endpoint}/upgrades?army=${roster.army}`)).
    then(resp => resp.json()).
    then(allUpgrades => {
        let upgradeList = [];
        const isLore = type.toLowerCase().includes('lore');
        if (isLore) {
            // to-do add a header to label these seperately
            upgradeList = [];

            const loreNames = Object.getOwnPropertyNames(roster.lores);
            loreNames.forEach(loreName => {
                if (!roster.lores[loreName])
                    upgradeList.push(allUpgrades.lores[loreName]);
            });

        } else {
            upgradeList = [allUpgrades[type]];
        }
        displayUpgrades(upgradeList);
    });
    loadScrollData();
}

const header = document.getElementById('army-header');
if (type.includes('battleFormation')) {
    header.textContent = 'Battle Formations';
}

addOverlayListener();

if (rosterId)
    loadUpgrades();
else if (armyName)
    loadUpgradesCatalog();
else
    loadUniversalLores();
