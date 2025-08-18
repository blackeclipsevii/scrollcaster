import { displayPoints, dynamicPages } from "../../lib/host.js";
import { endpoint } from "../../lib/endpoint.js";
import { fetchWithLoadingDisplay } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";
import { disableBackButton, dynamicGoTo, enableBackButton, enableSearchButton, setHeaderTitle, Settings } from "../../lib/widgets/header.js";
import { makeSelectableItemName } from "../../lib/widgets/helpers.js";
import { UpgradeSettings } from "./upgrades.js";
import { TacticsSettings } from "./tactics.js";
import { UnitSettings } from "./units.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { hidePointsOverlay } from "../../lib/widgets/displayPointsOverlay.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { ForceLUT } from "../../shared-lib/Force.js";
import { RegimentOfRenownSettings } from "./regimentOfRenown.js";
import ArmyInterf from "../../shared-lib/ArmyInterface.js";
import UpgradeInterf from "../../shared-lib/UpgradeInterface.js";
import { displayUpgradeOverlay } from "../../lib/widgets/displayUpgradeOverlay.js";
import { globalCache } from "../../lib/main.js";

export class CatalogSettings implements Settings{
    [name: string]: unknown;
    armyName = null as string | null;
    core = false;
    _doSub = true; // this is not intended for external use, just tracking history
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Catalog';
    }
    toUrl() {
        let url: string;
        if (this.armyName)
            url = `${window.location.origin}?page=${this.pageName}&armyName=${this.armyName}`;
        else
            url = `${window.location.origin}?page=${this.pageName}`;

        if (this.core)
            url += '&core=true';
        if (!this._doSub)
            url += '&_doSub=false';

        return url;
    }
};

const catalogPage = {
    settings: new CatalogSettings,
    _cache: {
        armies: null,
        regimentsOfRenown: null as ForceLUT | null
    },
    async fetchRegimentsOfRenown() {
        if (this._cache.regimentsOfRenown) {
            //return this._cache.regimentsOfRenown;
        }
        let result = await fetchWithLoadingDisplay(encodeURI(`${endpoint}/regimentsOfRenown`)) as ForceLUT | null;
        this._cache.regimentsOfRenown = result;
        return result;
    },
    async loadPage(settings: Settings) {
        if (!settings)
            settings = new CatalogSettings;
        this.settings = settings as CatalogSettings;
        const thisPage = this;

        const makeItem = (name: string, onclick: (this: HTMLDivElement, ev: MouseEvent) => any, listName: string, points: number | null = null) => {
            const itemList = document.getElementById(listName) as HTMLElement | null;
            if (!itemList) {
                return;
            }
            const item = document.createElement('div');
            item.classList.add('selectable-item');
        
            // Clicking the container navigates to details
            item.addEventListener('click', onclick);
        
            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            
            const nameEle = makeSelectableItemName(name);
            left.appendChild(nameEle);
        
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
            return item;
        }
        
        async function loadCore() {
            makeLayout(['Age of Sigmar'], null, null, true);
            
            makeItem('Warscrolls', () => {
                dynamicGoTo((new UnitSettings) as unknown as Settings);
            }, 'age-of-sigmar-list');
            
            makeItem('Battle Tactic Cards', () => {
                dynamicGoTo(new TacticsSettings);
            }, 'age-of-sigmar-list');          
        
            makeItem('Lores', () => {
                const settings = new UpgradeSettings;
                (settings as unknown as Settings).type = 'lores';
                (settings as unknown as Settings).titleName = 'Lores';
                dynamicGoTo(settings as unknown as Settings);
            }, 'age-of-sigmar-list');

            enableBackButton(); 
            swapLayout();
        }
        
        async function loadRor() {
            const unitsLUT = await thisPage.fetchRegimentsOfRenown();
            if (!unitsLUT)
                return;
            
            makeLayout(['Regiments of Renown'], null, null, true);
        
            const units = Object.values(unitsLUT);
            units.forEach(regimentOfRenown => {
                makeItem(regimentOfRenown.name, () => {
                    const settings = new RegimentOfRenownSettings;
                    settings.ror = regimentOfRenown;
                    dynamicGoTo(settings);
                }, 'regiments-of-renown-list', regimentOfRenown.points);
            });

            enableBackButton();
            swapLayout();
        }
        
        async function loadTome() {
            const _loadFaction = async (subFactionName: string) => {
                const split = subFactionName.split (' - ');
                let name = split[0];
                if (split.length > 1)
                    name = split[1];
                makeLayout([name], null, null, true);
                const listName = name.toLowerCase().trim().replace(/ /g, '-') + '-list';
                
                const url = `${endpoint}/armies?army=${subFactionName}`;
                await fetchWithLoadingDisplay(encodeURI(url), (uk: unknown) => {
                    const army = uk as ArmyInterf;
        
                    if (Object.getOwnPropertyNames(army.units).length > 0) {
                        makeItem('Warscrolls', () => {
                            const settings = new UnitSettings;
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        }, listName);
                    }
        
                    if (Object.getOwnPropertyNames(army.upgrades.battleTraits).length > 0) {
                        makeItem('Battle Traits', () => {
                            const names = Object.getOwnPropertyNames(army.upgrades.battleTraits);
                            const traits: UpgradeInterf[] = [];
                            names.forEach(name => {
                                traits.push(army.upgrades.battleTraits[name]);
                            })
                            displayUpgradeOverlay(traits);
                        }, listName);          
                    }
        
                    if (!army.isArmyOfRenown && army.upgrades.battleFormations) {
                        makeItem('Battle Formations', () => {
                            const settings = new UpgradeSettings;
                            settings.titleName = 'Battle Formation';
                            settings.type = 'battleFormations';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        }, listName);          
                    }
        
                    if (army.upgrades.enhancements) {
                        const enhancementNames = Object.getOwnPropertyNames(army.upgrades.enhancements);
                        enhancementNames.forEach(eName => {
                            makeItem(army.upgrades.enhancements[eName]!!.name, () => {
                                const settings = new UpgradeSettings;
                                settings.titleName = army.upgrades.enhancements[eName]!!.name;
                                settings.type = eName;
                                settings.armyName = subFactionName;
                                dynamicGoTo(settings);
                            }, listName);   
                        });
                    }
                    
                    if (Object.getOwnPropertyNames(army.upgrades.lores.manifestation).length > 6 ||
                        Object.getOwnPropertyNames(army.upgrades.lores.spell).length > 0 ||
                        Object.getOwnPropertyNames(army.upgrades.lores.prayer).length > 0) {
                        makeItem('Lores', () => {
                            const settings = new UpgradeSettings;
                            settings.titleName = 'Lores';
                            settings.type = 'lores';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        }, listName);          
                    }

                    enableBackButton(); 
                    swapLayout();
                });
            }
        
            if (thisPage.settings._doSub) {
                const subfactions: string[] = [];
                const faCallback = async (uk: unknown) => {
                    const armyAlliances = uk as {name: string, alliance: string}[];
                    armyAlliances.forEach(alliance => {
                        const army = alliance.name;
                        if (army.includes(thisPage.settings.armyName!!)) {
                            subfactions.push(army);
                        }
                    });
        
                    if (subfactions.length > 1) {
                        //const name = thisPage.settings.armyName as string;
                        makeLayout(['Armies'], null, null, true);

                        const listName = 'armies-list'; //name.toLowerCase().trim().replace(/ /g, '-') + '-list';
                        
                         subfactions.every(army => {
                            if (!army.includes(' - ')) {
                                makeItem(army, () => {
                                    const settings = new CatalogSettings;
                                    settings.armyName = army;
                                    settings._doSub = false;
                                    dynamicGoTo(settings, true, false); // update history but dont go
                                    thisPage.settings = settings;
                                    _loadFaction(army);
                                }, listName);
                                return false;
                            }
                            return true;
                        });
        
                        subfactions.forEach(army => {
                            if (army.includes(' - ')) {
                                makeItem(army.split(' - ')[1], () => {
                                    const settings = new CatalogSettings;
                                    settings.armyName = army;
                                    settings._doSub = false;
                                    dynamicGoTo(settings, true, false); // update history but dont go
                                    thisPage.settings = settings;
                                    _loadFaction(army);
                                }, listName);
                            }
                        });

                        enableBackButton(); 
                        swapLayout();
                    } else {
                        if (thisPage.settings.armyName)
                            _loadFaction(thisPage.settings.armyName);
                        else
                            console.log('expected army name');
                    }
                };

                const armies = await globalCache?.getArmies();
                if (armies) {
                    await faCallback(armies);
                }
            } else {
                if (thisPage.settings.armyName)
                    _loadFaction(thisPage.settings.armyName);
                else
                    console.log('expected army name');
            }
        }
        
        async function loadArmies() {
            disableBackButton();
            const sections = ['Core', 'Order', 'Chaos', 'Death', 'Destruction'];
            makeLayout(sections, null, null, true);
                
            let item = makeItem('Age of Sigmar', async () => {
                const settings = new CatalogSettings;
                settings.core = true;
                dynamicGoTo(settings, true, false); // update history but dont go
                thisPage.settings = settings;
                await loadCore();
            }, 'core-list');

            item = makeItem('Regiments of Renown', () => {
                const settings = new CatalogSettings;
                settings.armyName = 'ror';
                dynamicGoTo(settings, true, false); // update history but dont go
                thisPage.settings = settings;
                loadRor();
            }, 'core-list');

            const faCallback = async (uk: unknown) => {
                const alliances = uk as {name: string, alliance: string}[];
                alliances.forEach(alliance => {
                    const army = alliance.name;
                    if (army.includes(' - '))
                        return;

                    item = makeItem(army, () => {
                        const settings = new CatalogSettings;
                        settings.armyName = army;
                        dynamicGoTo(settings, true, false); // update history but dont go
                        thisPage.settings = settings;
                        loadTome();
                    }, `${alliance.alliance.toLowerCase()}-list`);
                });
            };
            const armies = await globalCache?.getArmies();
            if (armies) {
                await faCallback(armies);
            }

            swapLayout();
        }
        
        const loadTomePage = async () => {
            enableSearchButton();
            hidePointsOverlay();

            if (thisPage.settings.armyName)
                thisPage.settings.armyName === 'ror' ? await loadRor() : await loadTome();
            else if (thisPage.settings.core)
                await loadCore();
            else
                await loadArmies();
            
            initializeDraggable('catalog');
        }
        setHeaderTitle('Catalog');
        await loadTomePage();
    }
};

dynamicPages['catalog'] = catalogPage;