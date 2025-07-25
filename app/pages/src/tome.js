
class CatalogSettings {
    armyName = null;
    core = false;
};

const catalogPage = {
    settings: null,
    _cache: {
        armies: null,
        regimentsOfRenown: null
    },
    async fetchRegimentsOfRenown() {
        if (this._cache.regimentsOfRenown) {
            //return this._cache.regimentsOfRenown;
        }
        let result = null;
        await fetch(encodeURI(`${endpoint}/regimentsOfRenown`)).
              then(resp => resp.json()).
              then(units => result = units);
        this._cache.regimentsOfRenown = result;
        return result;
    },
    async loadPage(settings) {
        if (!settings)
            settings = new CatalogSettings;
        this.settings = settings;
        const thisPage = this;

        const coreVisible = (visible) => {
            visible ? disableBackButton() : enableBackButton();
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
            const h2 = document.getElementById('army-section').querySelector('.section-title');

            h2.textContent = 'Age of Sigmar';
        
            makeItem('Warscrolls', () => {
                dynamicGoTo(new UnitSettings);
            });
            
            makeItem('Battle Tactic Cards', () => {
                dynamicGoTo(new TacticsSettings);
            });          
        
            makeItem('Lores', () => {
                const settings = new UpgradeSettings;
                settings.type = 'lores';
                dynamicGoTo(settings);
            });
        }
        
        async function loadRor() {
            coreVisible(false);
            resetLists();
            const h2 = document.getElementById('army-section').querySelector('.section-title');
            h2.textContent = 'Regiments of Renown';
        
            const unitsLUT = await thisPage.fetchRegimentsOfRenown();
            const units = Object.values(unitsLUT);
            units.forEach(regimentOfRenown => {
                makeItem(regimentOfRenown.name, () => {
                    displayUpgradeOverlay(regimentOfRenown.upgrades);
                }, 'army-list', regimentOfRenown.points);
            });
        }
        
        async function loadTome(doSub = true) {
            coreVisible(false);
            resetLists();
            const h2 = document.getElementById('army-section').querySelector('.section-title');
            h2.textContent = thisPage.settings.armyName;
        
            const _loadFaction = async (subFactionName) => {
                resetLists();
                const url = `${endpoint}/armies?army=${subFactionName}`;
                await fetch(encodeURI(url)).
                then(resp => resp.json()).
                then(army => {           
                    h2.textContent = army.name;
        
                    if (army.units.length > 0) {
                        makeItem('Warscrolls', () => {
                            const settings = new UnitSettings;
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });
                    }
        
                    if (Object.getOwnPropertyNames(army.upgrades.battleTraits).length > 0) {
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
                            const settings = new UpgradeSettings;
                            settings.type = 'battleFormations';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });          
                    }
        
                    if (Object.getOwnPropertyNames(army.upgrades.artefacts).length > 0) {
                        makeItem('Artefacts of Power', () => {
                            const settings = new UpgradeSettings;
                            settings.type = 'artefacts';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });          
                    }
        
                    if (Object.getOwnPropertyNames(army.upgrades.heroicTraits).length > 0) {
                        makeItem('Heroic Traits', () => {
                            const settings = new UpgradeSettings;
                            settings.type = 'heroicTraits';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });          
                    }

                    if (Object.getOwnPropertyNames(army.upgrades.monstrousTraits).length > 0) {
                        makeItem('Monstrous Traits', () => {
                            const settings = new UpgradeSettings;
                            settings.type = 'monstrousTraits';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });          
                    }
        
                    if (Object.getOwnPropertyNames(army.upgrades.lores.manifestation).length > 6 ||
                        Object.getOwnPropertyNames(army.upgrades.lores.spell).length > 0 ||
                        Object.getOwnPropertyNames(army.upgrades.lores.prayer).length > 0) {
                        makeItem('Lores', () => {
                            const settings = new UpgradeSettings;
                            settings.type = 'lores';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });          
                    }
                });
            }
        
            if (doSub) {
                const subfactions = [];
                await fetchArmies(async (allArmies) => {
                    allArmies.forEach(army => {
                        if (army.includes(thisPage.settings.armyName)) {
                            subfactions.push(army);
                        }
                    });
        
                    if (subfactions.length > 1) {
                         subfactions.every(army => {
                            if (!army.includes(' - ')) {
                                makeItem(army, () => {
                                    const settings = new CatalogSettings;
                                    settings.armyName = army;
                                    dynamicGoTo(settings, true, false); // update history but dont go
                                    thisPage.settings = settings;
                                    _loadFaction(army);
                                });
                                return false;
                            }
                            return true;
                        });
        
                        subfactions.forEach(army => {
                            if (army.includes(' - ')) {
                                makeItem(army.split(' - ')[1], () => {
                                    const settings = new CatalogSettings;
                                    settings.armyName = army;
                                    dynamicGoTo(settings, true, false); // update history but dont go
                                    thisPage.settings = settings;
                                    _loadFaction(army);
                                });
                            }
                        });
                    } else {
                        _loadFaction(thisPage.settings.armyName);
                    }
                });
        
                return;
            }
        }
        
        async function loadArmies() {
            coreVisible(true);
            const h2 = document.getElementById('army-section').querySelector('.section-title');

            h2.textContent = 'Armies';
        
            makeItem('Age of Sigmar', async () => {
                const settings = new CatalogSettings;
                settings.core = true;
                dynamicGoTo(settings, true, false); // update history but dont go
                coreVisible(false);
                resetLists();
                thisPage.settings = settings;
                await loadCore();
            }, 'core-list');
            
            makeItem('Regiments of Renown', () => {
                const settings = new CatalogSettings;
                settings.armyName = 'ror';
                dynamicGoTo(settings, true, false); // update history but dont go
                coreVisible(false);
                resetLists();
                thisPage.settings = settings;
                loadRor();
            }, 'core-list');
        
            const loader = document.getElementById('armies-loader-box');
            //loader.style.display = 'block';
            await fetchArmies(async (allArmies) => {
              //  loader.style.display = 'none';
                allArmies.forEach(army => {
                    if (army.includes(' - '))
                        return;
        
                    makeItem(army, () => {
                        const settings = new CatalogSettings;
                        settings.armyName = army;
                        dynamicGoTo(settings, true, false); // update history but dont go
                        coreVisible(false);
                        resetLists();
                        thisPage.settings = settings;
                        loadTome();
                    }, 'army-list');
                });
            });
        }
        
        const loadTomePage = async () => {
            const _makeSection = (main, name) => {
                const section = document.createElement('div');
                section.style.display = 'none';
                section.id = `${name.toLowerCase()}-section`;
                section.className = 'section';
                section.innerHTML = `
                    <div>
                    <h3 class="section-title">${name}</h3>
                    <div id="${name.toLowerCase()}-loader-box" style="display: none; margin: 1em; width: 1em; height: 1em;">
                        <div id="${name.toLowerCase()}-loader" class="loader"></div>
                    </div>
                    </div>
                    <div class="item-list" id="${name.toLowerCase().replace(/ /g, '-')}-list"></div>
                `;
                main.appendChild(section);
            }   
        
            const sections = [
                'Core', 'Army'
            ];
            if (document.getElementById('core-section')) {
                clearLayout();
            }
            makeLayout(sections);
            disableHeaderContextMenu();
            hidePointsOverlay();
            document.getElementById('army-section').style.display = 'block';

            if (thisPage.settings.armyName)
                thisPage.settings.armyName === 'ror' ? await loadRor() : await loadTome();
            else if (thisPage.settings.core)
                await loadCore();
            else
                await loadArmies();
            
            swapLayout();
        }
        setHeaderTitle('Catalog');
        await loadTomePage();
    }
};

dynamicPages['catalog'] = catalogPage;