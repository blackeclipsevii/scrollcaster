
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
        const upgrades = allUpgrades[type];
        const upgradeNames = Object.getOwnPropertyNames(upgrades);
        upgradeNames.forEach(upgradeName => {
            const upgrade = upgrades[upgradeName];
            const item = document.createElement('div');
            item.classList.add('upgrade-item');

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                const overlay = document.getElementById("overlay");
                if (overlay.style.display === "flex") {
                    overlay.style.display = "none";
                } else {
                    overlay.style.display = "flex";
                    const modal = document.querySelector(".modal");
                    modal.innerHTML = '';
                    widgetAbilityDisplayAbilities(upgrade, modal);
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
            addBtn.classList.add('add-btn');
            addBtn.textContent = '+';
            addBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevents click from triggering page change
                if (type.includes('battleFormation'))
                    roster.battleFormation = upgrade;
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