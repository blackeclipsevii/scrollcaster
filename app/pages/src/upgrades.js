
class UpgradeSettings {
    type = null;
    roster = null;
    armyName = null;

    isLore() {
        return this.type && this.type.toLowerCase().includes('lore')
    }
}

const upgradePage = {
    settings: null,
    _cache: {
        upgrades: null,
        armyName: null
    },
    async fetchUpgrades(armyName) {
        if (this._cache.upgrades && this._cache.armyName === armyName) {
            return this._cache.upgrades;
        }
        let result = null;
        await fetch(encodeURI(`${endpoint}/upgrades?army=${armyName}`)).
            then(resp => resp.json()).
            then(allUpgrades => result = allUpgrades);
        this._cache.upgrades = result;
        this._cache.armyName = armyName;
        return result;
    },
    loadPage(settings) {
        const thisPage = this;
        
        if (!settings)
            settings = new UpgradeSettings;

        thisPage.settings = settings;

        const getList = (upgrade) => {
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
            } else if (upgrade.type === 8) {
                upgradeList = document.getElementById('monstrous-traits-list');
            }else {
                console.log(`upgrade: ${upgrade}`);
                console.log(`type unknown: ${upgrade.name}`);
                document.querySelector('.item-list');
            }
            return upgradeList;
        }

        const typeToStr = (unit) => {
            if (unit.type === 0)
                return 'Artefact';
            if (unit.type == 1)
                return 'Heroic Trait';
            if (unit.type == 2)
                return 'Battle Formation';
            if (unit.type == 3)
                return 'Spell Lore';
            if (unit.type == 6)
                return 'Prayer Lore';
            if (unit.type == 4)
                return 'Manifestation Lore';
            if (unit.type == 8)
                return 'Monstrous Trait';
            return 'Unknown';
        }
        
        const isUniversal = (str) => {
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

            const typeEle = document.createElement('p');
            typeEle.className = 'selectable-item-type ability-label';
            typeEle.style.display = 'inline-block';
            typeEle.textContent = typeToStr(upgrade);
            typeEle.style.fontSize = '10px';
            typeEle.style.backgroundColor = 'grey';
            typeEle.style.marginRight = '1em';
            left.appendChild(typeEle);
        
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
        
            if (thisPage.settings.roster) {
                const addBtn = document.createElement('button');
                addBtn.classList.add('rectangle-button');
                addBtn.textContent = '+';
                addBtn.addEventListener('click', async (e) => {
                    e.stopPropagation(); // Prevents click from triggering page change
                    const type = thisPage.settings.type;
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
                if (thisPage.settings && thisPage.settings.isLore()) {
                    if (thisPage.settings.roster) {
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
                    } else if (thisPage.settings.armyName) {
                        upgradeNames = upgradeNames.filter(name => !isUniversal(name));
                    }
                }
                upgradeNames.forEach(upgradeName => {
                    const upgrade = upgrades[upgradeName];
                    displayUpgrade(upgrade);
                });
            });
        }
        
        async function loadUniversalLores() {
            setHeaderTitle('Universal Manifestation Lores');
            hidePointsOverlay();
            await fetch(encodeURI(`${endpoint}/lores`)).
            then(resp => resp.json()).
            then(loreObject => {
                loreObject.universal.forEach(ulut => {
                    const lore = loreObject.lores.manifestation[ulut.id];
                    displayUpgrade(lore);
                });
            });
        }
        
        async function loadUpgradesCatalog() {
            setHeaderTitle('Upgrades');
            hidePointsOverlay();
            const allUpgrades = await thisPage.fetchUpgrades(thisPage.settings.armyName);
            let upgradeList = [];
            if (thisPage.settings && thisPage.settings.isLore()) {
                // to-do add a header to label these seperately
                upgradeList = [];
    
                const loreNames = Object.getOwnPropertyNames(allUpgrades.lores);
                loreNames.forEach(loreName => {
                    upgradeList.push(allUpgrades.lores[loreName]);
                });
    
            } else {
                upgradeList = [allUpgrades[thisPage.settings.type]];
            }
            
            displayUpgrades(upgradeList);
        }
        
        async function loadUpgrades() {
            setHeaderTitle('Upgrades');
            displayPointsOverlay(thisPage.settings.roster.id);
            refreshPointsOverlay(thisPage.settings.roster.id);
            updateValidationDisplay();
        
            const allUpgrades = await thisPage.fetchUpgrades(roster.army);
            let upgradeList = [];
            if (thisPage.settings && thisPage.settings.isLore()) {
                // to-do add a header to label these seperately
                upgradeList = [];
    
                const loreNames = Object.getOwnPropertyNames(roster.lores);
                loreNames.forEach(loreName => {
                    if (!roster.lores[loreName])
                        upgradeList.push(allUpgrades.lores[loreName]);
                });
    
            } else {
                upgradeList = [allUpgrades[thisPage.settings.type]];
            }
            displayUpgrades(upgradeList);
        }
        
        const loadUpgradesPage = () => {
            const sections = [
                'Artefacts of Power', 
                'Heroic Traits', 
                'Monstrous Traits', 
                'Battle Formations', 
                'Spell Lore', 
                'Prayer Lore', 
                'Manifestation Lore'
            ];

            makeLayout(sections);
            initializeFavoritesList();
            disableHeaderContextMenu();
            if (thisPage.settings.roster)
                loadUpgrades();
            else if (thisPage.settings.armyName)
                loadUpgradesCatalog();
            else
                loadUniversalLores();
            
            swapLayout();
        }
        
        loadUpgradesPage();
    }
}

dynamicPages['upgrades'] = upgradePage;