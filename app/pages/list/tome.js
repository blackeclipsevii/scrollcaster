
const catalogPage = {
    loadPage: () => {
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
            const h2 = document.getElementById('army-section').querySelector('.section-title');

            h2.textContent = 'Age of Sigmar';
        
            makeItem('Warscrolls', () => {
                goTo(`/pages/list/list.html`);
            });
            
            makeItem('Battle Tactic Cards', () => {
                goTo(`/pages/list/list.html?tactics=true`, false);
                tacticsPage.loadPage();
            });          
        
            makeItem('Lores', () => {
                goTo(`/pages/list/list.html?type=lore&upgrades=true`, false);
                const ugSettings = new UpgradeSettings;
                ugSettings.type = 'lores';
                dynamicPages['upgrades'].loadPage(ugSettings);
            });
        }
        
        async function loadRor() {
            coreVisible(false);
            resetLists();
            const h2 = document.getElementById('army-section').querySelector('.section-title');

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
            const h2 = document.getElementById('army-section').querySelector('.section-title');
            h2.textContent = armyName;
        
            const _loadFaction = async (subFactionName) => {
                resetLists();
                const url = `${endpoint}/armies?army=${subFactionName}`;
                await fetch(encodeURI(url)).
                then(resp => resp.json()).
                then(army => {           
                    h2.textContent = army.name;
        
                    if (army.units) {
                        makeItem('Warscrolls', () => {
                            goTo(`/pages/list/list.html?army=${subFactionName}`);
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
                            goTo(`/pages/list/list.html?armyName=${subFactionName}&type=battleFormation&upgrades=true`, false);
                            const ugSettings = new UpgradeSettings;
                            ugSettings.type = 'battleFormations';
                            ugSettings.armyName = subFactionName;
                            dynamicPages['upgrades'].loadPage(ugSettings);
                        });          
                    }
        
                    if (army.upgrades.artefacts) {
                        makeItem('Artefacts of Power', () => {
                            goTo(`/pages/list/list.html?armyName=${subFactionName}&type=artefact&upgrades=true`, false);
                            const ugSettings = new UpgradeSettings;
                            ugSettings.type = 'artefacts';
                            ugSettings.armyName = subFactionName;
                            dynamicPages['upgrades'].loadPage(ugSettings);
                        });          
                    }
        
                    if (army.upgrades.heroicTraits) {
                        makeItem('Heroic Traits', () => {
                            goTo(`/pages/list/list.html?armyName=${subFactionName}&type=heroicTrait&upgrades=true`, false);
                            const ugSettings = new UpgradeSettings;
                            ugSettings.type = 'heroicTraits';
                            ugSettings.armyName = subFactionName;
                            dynamicPages['upgrades'].loadPage(ugSettings);
                        });          
                    }
        
                    if (Object.getOwnPropertyNames(army.upgrades.lores.manifestation).length > 6 ||
                        Object.getOwnPropertyNames(army.upgrades.lores.spell).length > 0||
                        Object.getOwnPropertyNames(army.upgrades.lores.prayer).length > 0) {
                        makeItem('Lores', () => {
                            goTo(`/pages/list/list.html?armyName=${subFactionName}&type=lore&upgrades=true`, false);
                            const ugSettings = new UpgradeSettings;
                            ugSettings.type = 'lores';
                            ugSettings.armyName = subFactionName;
                            dynamicPages['upgrades'].loadPage(ugSettings);
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
                                    goTo(`/pages/list/list.html?army=${armyName}&loadScrollData=true&catalog=true`, false);
                                    _loadFaction(armyName);
                                });
                                return false;
                            }
                            return true;
                        });
        
                        subfactions.forEach(army => {
                            if (army.includes(' - ')) {
                                makeItem(army.split(' - ')[1], () => {
                                    goTo(`/pages/list/list.html?army=${army}&loadScrollData=true&catalog=true`, false);
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
            const h2 = document.getElementById('army-section').querySelector('.section-title');

            h2.textContent = 'Armies';
        
            makeItem('Age of Sigmar', () => {
                goTo(`/pages/list/list.html?core=true&catalog=true`, false);
                coreVisible(false);
                resetLists();
                core = true;
                armyName = null;
                loadCore();
            }, 'core-list');
            
            makeItem('Regiments of Renown', () => {
                goTo(`/pages/list/list.html?army=ror&catalog=true`, false);
                coreVisible(false);
                resetLists();
                core = false;
                armyName = null;
                loadRor();
            }, 'core-list');
        
            const loader = document.getElementById('core-loader-box');
            loader.style.display = 'block';
            await fetchArmies(async (allArmies) => {
                loader.style.display = 'none';
                allArmies.forEach(army => {
                    if (army.includes(' - '))
                        return;
        
                    makeItem(army, () => {
                        goTo(`/pages/list/list.html?army=${army}&catalog=true`, false);
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
        
        const loadTomePage = () => {
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
        
            const _makeLayout = (sections) => {
                const main = document.querySelector('.main');
                sections.forEach(name => {
                    _makeSection(main, name)
                });
            }
            const sections = [
                'Core', 'Army'
            ];
            _makeLayout(sections);
            document.getElementById('army-section').style.display = 'block';

            if (armyName)
                armyName === 'ror' ? loadRor() : loadTome();
            else if (core)
                loadCore();
            else
                loadArmies();
                
        }
        setHeaderTitle('Catalog');
        loadTomePage();
    }
};

dynamicPages['catalog'] = catalogPage;