
const upgradePage = {
    loadPage : () => {
        if (type)
        type = decodeURI(type) + 's';
        
        function getList(upgrade) {
            let upgradeList = null;
            if (upgrade.type === 0) {
                upgradeList = document.getElementById('artefacts-of-power-list');
            } else if (upgrade.type === 1) {
                upgradeList = document.getElementById('heroic-traits-list');
            } else if (upgrade.type === 2) {
                upgradeList = document.getElementById('battle-formations-list');
            } else if (upgrade.type === 3) {
                upgradeList = document.getElementById('spell-lore-list');
            } else if (upgrade.type === 6) {
                upgradeList = document.getElementById('prayer-lore-list');
            }else if (upgrade.type === 4) {
                upgradeList = document.getElementById('manifestation-lore-list');
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
        
            if (roster) {
                item.classList.add('not-added');
            }
        
            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            
            // Clicking the container navigates to details
            left.addEventListener('click', () => {
                displayUpgradeOverlay(upgrade);
            });
        
            const nameEle = document.createElement('p');
            nameEle.className = 'selectable-item-name';
            nameEle.textContent = upgrade.name;
            nameEle.style.padding = '0px';
            nameEle.style.margin = '0px';
            left.appendChild(nameEle);
        
            const right = document.createElement('div');
            right.classList.add('selectable-item-right');
        
            const points = document.createElement('span');
            points.className = 'points-label';
            displayPoints(points, upgrade.points);
        
            const onchange = newFavoritesOnChange(upgradeList, item, upgrade.name);
            // battle formation doesn't have id?
            const useableId = upgrade.name; //upgrade.type === 2 ? upgrade.name : upgrade.id; 
            const heart = newFavoritesCheckbox(useableId, 'upgrade', onchange);
            right.append(heart);
        
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
                    if (roster)
                        item.classList.remove('not-added');
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
            
            if (heart.checked)
                onchange(true, useableId, 'upgrade');
        }
        
        function displayUpgrades(upgradeList) {
            upgradeList.forEach(upgrades => {
                if (!upgrades)
                    return;
        
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
            setHeaderTitle('Upgrades');
            await fetch(encodeURI(`${endpoint}/upgrades?army=${armyName}`)).
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
                loadScrollData();
            });
        }
        
        async function loadUniversalLores() {
            setHeaderTitle('Universal Manifestation Lores');
            await fetch(encodeURI(`${endpoint}/lores`)).
            then(resp => resp.json()).
            then(loreObject => {
                loreObject.universal.forEach(ulut => {
                    const lore = loreObject.lores.manifestation[ulut.id];
                    displayUpgrade(lore);
                });
                loadScrollData();
            });
        }
        
        async function loadUpgrades() {
            setHeaderTitle('Upgrades');
            roster = await getRoster(rosterId);
            displayPointsOverlay(rosterId);
            refreshPointsOverlay(rosterId);
            updateValidationDisplay();
        
            await fetch(encodeURI(`${endpoint}/upgrades?army=${roster.army}`)).
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
                loadScrollData();
            });
        }
        
        const loadUpgradesPage = () => {
            const _makeSection = (main, name) => {
                const section = document.createElement('div');
                section.style.display = 'none';
                section.className = 'section';
                section.innerHTML = `
                    <h3 class="section-title">${name}</h3>
                    <div class="item-list" id="${name.toLowerCase().replace(/ /g, '-')}-list"></div>
                `;
                main.appendChild(section);
            }   
        
            const _makeLayout = (sections) => {
                const main = document.querySelector('.main');
                sections.forEach(name => {
                    _makeSection(main, name)
                });
            }
            const sections = [
                'Artefacts of Power', 
                'Heroic Traits', 
                'Battle Formations', 
                'Spell Lore', 
                'Prayer Lore', 
                'Manifestation Lore'
            ];
            _makeLayout(sections);
        
            if (rosterId)
                loadUpgrades();
            else if (armyName)
                loadUpgradesCatalog();
            else
                loadUniversalLores();
        }
        
        addOverlayListener();
        loadUpgradesPage();
    }
}
