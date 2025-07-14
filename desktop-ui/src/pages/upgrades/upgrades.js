
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
const auxiliary = params.get('auxiliary');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));

let type = params.get('type');
if (type)
    type = decodeURI(type) + 's';

const overlay = document.getElementById('overlay');
overlay.addEventListener('click', function(event) {
  if (event.target === overlay) {
    overlay.style.display = 'none';
  }
});

async function loadUpgrades() {
    const roster = await getRoster(rosterId);
    await fetch(encodeURI(`${hostname}:${port}/upgrades?army=${roster.army}`)).
    then(resp => resp.json()).
    then(allUpgrades => {
        let upgradeList = [];
        const isLore = type.toLowerCase().includes('lore');
        if (isLore) {
            upgradeList = [allUpgrades.spellLores, allUpgrades.manifestationLores];
        } else {
            upgradeList = [allUpgrades[type]];
        }
        upgradeList.forEach(upgrades => {
            const upgradeNames = Object.getOwnPropertyNames(upgrades);
            upgradeNames.forEach(upgradeName => {
                const upgrade = upgrades[upgradeName];
                const item = document.createElement('div');
                item.classList.add('upgrade-item');

                // Clicking the container navigates to details
                item.addEventListener('click', () => {
                    const overlay = document.getElementById("overlay");
                    const visibleStyle = 'block';
                    if (overlay.style.display === visibleStyle) {
                        overlay.style.display = "none";
                    } else {
                        overlay.style.display = visibleStyle;
                        const modal = document.querySelector(".modal");
                        modal.innerHTML = '';
                        if (isLore) {
                            widgetAbilityDisplayAbilities(upgrade.spells, modal);
                        } else {
                            widgetAbilityDisplayAbilities(upgrade, modal);
                        }
                    }
                });

                const left = document.createElement('div');
                left.classList.add('unit-left');
                left.textContent = upgrade.name;

                const right = document.createElement('div');
                right.classList.add('unit-right');

                const points = document.createElement('span');
                points.textContent = upgrade.points ? `${upgrade.points} pts` : '';

                const addBtn = document.createElement('button');
                addBtn.classList.add('rectangle-button');
                addBtn.textContent = '+';
                addBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Prevents click from triggering page change
                    if (type.includes('battleFormation')) {
                        roster.battleFormation = upgrade;
                    } else if (upgrade.type === 3) {
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

                const upgradeList = document.querySelector('.upgrade-list');
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