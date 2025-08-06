
class UpgradeSettings {
    titleName = null;
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
        const result = await fetchUpgrades(armyName);
        this._cache.upgrades = result;
        this._cache.armyName = armyName;
        return result;
    },
    loadPage(settings) {
        const thisPage = this;
        
        if (!settings)
            settings = new UpgradeSettings;

        thisPage.settings = settings;

        const isUniversal = (str) => {
            return str.startsWith("UNIVERSAL-");
        }
        
        function displayUpgrade(upgrade) {
            let typeName = 'Upgrade';
            if (upgrade.typeName) 
                typeName = upgrade.typeName;
            else if (upgrade.type !== undefined) {
                typeName = upgradeTypeToStr(upgrade);
            }
            const adjustedName = typeName.toLowerCase().replace(/ /g, '-');
            let section = document.getElementById(`${adjustedName}-section`);
            if (!section) {
                const main = document.getElementById('loading-content');
                section = layoutDefaultFactory(main, typeName);
            }
            let upgradeList = section.querySelector('.item-list');
        
            section.style.display = 'block';
        
            const item = document.createElement('div');
            item.classList.add('selectable-item');
            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                displayUpgradeOverlay(upgrade);
            });
            
            if (roster && !_inCatalog) {
                item.classList.add('not-added');
            }
        
            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            
            const nameEle = makeSelectableItemName(upgrade);
            left.appendChild(nameEle);

            const typeEle = makeSelectableItemType(upgrade, false);
            left.appendChild(typeEle);
        
            const right = document.createElement('div');
            right.classList.add('selectable-item-right');
        
            const points = document.createElement('span');
            points.className = 'points-label';
            displayPoints(points, upgrade.points);
            
            let heart = null;
            if (thisPage.settings.roster) {
                const checkbox = document.createElement('input');
                checkbox.classList.add('upgrade-checkbox');
                checkbox.type = "radio";
                checkbox.name = `${upgrade.type}`;
                checkbox.style.transform = 'scale(1.5)';

                checkbox.onclick = (e) =>{
                    e.stopPropagation();
                }
    
                //checkbox.textContent = '+';
                checkbox.addEventListener('change', async (e) => {
                    e.stopPropagation(); // Prevents click from triggering page change
                    
                    const type = thisPage.settings.type;
                    if (e.target.checked) {
                        const allSelectables = section.querySelectorAll('.selectable-item');
                        allSelectables.forEach(selectable => {
                            if (!selectable.classList.contains('not-added')) {
                                selectable.classList.add('not-added');
                                selectable.classList.remove('added');
                            }
                        });
                        item.classList.remove('not-added');
                        item.classList.add('added');
                        if (type.includes('battleFormation')) {
                            roster.battleFormation = upgrade;
                        } else if (upgrade.type == 3) {
                            roster.lores.spell = upgrade;   
                        } else if (upgrade.type == 4) {
                            roster.lores.manifestation = upgrade;
                        } else if (upgrade.type == 6) {
                            roster.lores.prayer = upgrade;
                        }
                    }
                    await putRoster(roster);
                });

                const doEnable = () => {
                    checkbox.checked = true;
                    item.classList.remove('not-added');
                    item.classList.add('added');
                }

                if (upgrade.type === 3 && roster.lores.spell) {
                    if (upgrade.id.localeCompare(roster.lores.spell.id) === 0) {
                        doEnable();
                    }
                } 
                else if (upgrade.type === 4 && roster.lores.manifestation) {
                    if (upgrade.id.localeCompare(roster.lores.manifestation.id) === 0) {
                        doEnable();
                    }
                }
                else if (upgrade.type === 6 && roster.lores.prayer) {
                    if (upgrade.id.localeCompare(roster.lores.prayer.id) === 0) {
                        doEnable();
                    }
                }
                else if (roster.battleFormation) {
                    if (upgrade.id.localeCompare(roster.battleFormation.id) === 0) {
                        doEnable();
                    }
                }
        
                right.append(points, checkbox);
            } else {
                // to-do this being a radio makes favorites weird
                const onchange = newFavoritesOnChange(upgradeList, item, upgrade.name);
                // battle formation doesn't have id?
                heart = newFavoritesCheckbox(upgrade.id, 'upgrade', onchange);
                right.append(heart, points);
            }
            item.append(left, right);
            upgradeList.appendChild(item);
            
            if (heart && heart.checked)
                heart.onchange(true, upgrade.id, 'upgrade');
        }
        
        function displayUpgrades(upgradeList) {
            upgradeList.forEach(upgrades => {
                if (!upgrades)
                    return;
        
                let upgradeNames = Object.getOwnPropertyNames(upgrades);
                if (thisPage.settings && thisPage.settings.isLore()) {
                    if (thisPage.settings.roster) {
                        if (upgradeNames.length > 1) {
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
                        }
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
            await fetchWithLoadingDisplay(encodeURI(`${endpoint}/lores`),
            loreObject => {
                loreObject.universal.forEach(ulut => {
                    const lore = loreObject.lores.manifestation[ulut.id];
                    displayUpgrade(lore);
                });
            });
        }
        
        async function loadUpgradesCatalog() {
            if (thisPage.settings.titleName)
                setHeaderTitle(thisPage.settings.titleName);
            else
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
                let tmp = allUpgrades[thisPage.settings.type];
                if (!tmp) {
                    tmp = allUpgrades.enhancements[thisPage.settings.type];
                    if (tmp) {
                        upgradeList = [tmp.upgrades];
                    }
                } else {
                    upgradeList = [allUpgrades[thisPage.settings.type]];
                }
            }
            
            displayUpgrades(upgradeList);
        }
        
        async function loadUpgrades() {
            if (thisPage.settings.titleName)
                setHeaderTitle(thisPage.settings.titleName);
            else
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
                    upgradeList.push(allUpgrades.lores[loreName]);
                });
    
            } else {
                let tmp = allUpgrades[thisPage.settings.type];
                if (!tmp) {
                    tmp = allUpgrades.enhancements[thisPage.settings.type];
                    if (tmp) {
                        upgradeList = [tmp.upgrades];
                    }
                } else {
                    upgradeList = [allUpgrades[thisPage.settings.type]];
                }
            }
            displayUpgrades(upgradeList);
        }
        
        const loadUpgradesPage = async () => {
            const sections = [];

            makeLayout(sections);
            initializeFavoritesList();
            disableHeaderContextMenu();
            if (thisPage.settings.roster)
                await loadUpgrades();
            else if (thisPage.settings.armyName)
                await loadUpgradesCatalog();
            else
                await loadUniversalLores();
            
            const manLoreSect = document.getElementById('manifestation-lore-section');
            if (manLoreSect && manLoreSect.parentElement) {
                manLoreSect.parentElement.appendChild(manLoreSect);
            }

            swapLayout();
            initializeDraggable('upgrades');
        }
        
        loadUpgradesPage();
    }
}

dynamicPages['upgrades'] = upgradePage;