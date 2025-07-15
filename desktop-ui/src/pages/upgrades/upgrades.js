
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
fixedPreviousUrl = encodeURI(`../army/army.html?id=${rosterId}`);

const auxiliary = params.get('auxiliary');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));

let type = params.get('type');
if (type)
    type = decodeURI(type) + 's';

async function loadUpgrades() {
    roster = await getRoster(rosterId);

    let url = null;
    if (type === 'tactics') {
        url = `${hostname}:${port}/tactics`
    } else {
        url = `${hostname}:${port}/upgrades?army=${roster.army}`;
    }
    await fetch(encodeURI(`${hostname}:${port}/upgrades?army=${roster.army}`)).
    then(resp => resp.json()).
    then(allUpgrades => {
        let upgradeList = [];
        const isLore = type.toLowerCase().includes('lore');
        if (isLore) {
            // to-do add a header to label these seperately
            upgradeList = [];
            if (!roster.manifestationLore)
                upgradeList.push(allUpgrades.manifestationLores);

            if (!roster.spellLore)
                upgradeList.push(allUpgrades.spellLores);

        } else {
            upgradeList = [allUpgrades[type]];
        }
        upgradeList.forEach(upgrades => {
            const upgradeNames = Object.getOwnPropertyNames(upgrades);
            upgradeNames.forEach(upgradeName => {
                const upgrade = upgrades[upgradeName];

                let upgradeList = null;
                if (upgrade.type === 2) {
                    upgradeList = document.getElementById('formation-list');
                } else if (upgrade.type === 3) {
                    upgradeList = document.getElementById('spell-list');
                } else if (upgrade.type === 4) {
                    upgradeList = document.getElementById('manifestation-list');
                } else {
                    console.log(`type unknown: ${upgradeNames}`);
                    document.querySelector('.item-list');
                }
    
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
                        roster.spellLore = upgrade;   
                    } else if (upgrade.type == 4) {
                        roster.manifestationLore = upgrade;
                    }
                    await putRoster(roster);
                    goBack();
                    // window.location.href = `../army/army.html?id=${rosterId}`;
                });

                right.append(points, addBtn);
                item.append(left, right);
                upgradeList.appendChild(item);
            });
        });
    });
    loadScrollData();
}

const header = document.getElementById('army-header');
if (type.includes('battleFormation')) {
    header.textContent = 'Choose a Battle Formation';
}else if (type.includes('artefact')) {
    header.textContent = 'Choose an Artifact';
} else if (type.includes('battleTrait')) {
    header.textContent = 'Choose a Battle Trait';
}

loadUpgrades();
addOverlayListener();