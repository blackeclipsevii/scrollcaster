import { displayPoints } from "@/lib/host";
import { getEndpoint } from "@/lib/endpoint";
import { fetchWithLoadingDisplay } from "@/lib/RestAPI/fetchWithLoadingDisplay";
import { disableBackButton, enableBackButton, enableSearchButton, getPageRouter, setHeaderTitle } from "@/lib/widgets/header";
import { makeSelectableItemName } from "@/lib/widgets/helpers";
import { makeLayout, swapLayout } from "@/lib/widgets/layout";
import { hidePointsOverlay } from "@/lib/widgets/displayPointsOverlay";
import { initializeDraggable } from "@/lib/widgets/draggable";
import ArmyInterf from "@scrollcaster/shared-lib/ArmyInterface";
import UpgradeInterf from "@scrollcaster/shared-lib/UpgradeInterface";
import { displayUpgradeOverlay } from "@/lib/widgets/displayUpgradeOverlay";
import { getGlobalCache } from "@/lib/RestAPI/LocalCache";

import Settings from "./settings/Settings";
import CatalogSettings from "./settings/CatalogSettings";
import RegimentOfRenownSettings from "./settings/RegimentOfRenownSettings";
import TacticsSettings from "./settings/TacticsSettings";
import UnitSettings from "./settings/UnitsSettings";
import UpgradeSettings from "./settings/UpgradeSettings";

const catalogPage = {
    settings: new CatalogSettings,
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
                getPageRouter()?.goTo(new UnitSettings);
            }, 'age-of-sigmar-list');
            
            makeItem('Battle Tactic Cards', () => {
                getPageRouter()?.goTo(new TacticsSettings);
            }, 'age-of-sigmar-list');          
        
            makeItem('Lores', () => {
                const settings = new UpgradeSettings;
                settings.type = 'lores';
                settings.titleName = 'Lores';
                getPageRouter()?.goTo(settings);
            }, 'age-of-sigmar-list');

            enableBackButton(); 
            swapLayout();
        }
        
        async function loadRor() {
            const unitsLUT = await getGlobalCache()?.getRegimentsOfRenown();
            if (!unitsLUT)
                return;
            
            makeLayout(['Regiments of Renown'], null, null, true);
        
            const units = Object.values(unitsLUT);
            units.forEach(regimentOfRenown => {
                makeItem(regimentOfRenown.name, () => {
                    const settings = new RegimentOfRenownSettings;
                    settings.ror = regimentOfRenown;
                    getPageRouter()?.goTo(settings);
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
                
                const url = `${getEndpoint()}/armies?army=${subFactionName}`;
                await fetchWithLoadingDisplay(encodeURI(url), (uk: unknown) => {
                    const army = uk as ArmyInterf;
        
                    if (Object.getOwnPropertyNames(army.units).length > 0) {
                        makeItem('Warscrolls', () => {
                            const settings = new UnitSettings;
                            settings.armyName = subFactionName;
                            getPageRouter()?.goTo(settings);
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
                            getPageRouter()?.goTo(settings);
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
                                getPageRouter()?.goTo(settings);
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
                            getPageRouter()?.goTo(settings);
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
                                    getPageRouter()?.goTo(settings, true, false); // update history but dont go
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
                                    getPageRouter()?.goTo(settings, true, false); // update history but dont go
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

                const armies = await getGlobalCache()?.getArmies();
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
                getPageRouter()?.goTo(settings, true, false); // update history but dont go
                thisPage.settings = settings;
                await loadCore();
            }, 'core-list');

            item = makeItem('Regiments of Renown', () => {
                const settings = new CatalogSettings;
                settings.armyName = 'ror';
                getPageRouter()?.goTo(settings, true, false); // update history but dont go
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
                        getPageRouter()?.goTo(settings, true, false); // update history but dont go
                        thisPage.settings = settings;
                        loadTome();
                    }, `${alliance.alliance.toLowerCase()}-list`);
                });
            };
            const armies = await getGlobalCache()?.getArmies();
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

export const registerCatalogPage = () => {
    getPageRouter()?.registerPage('catalog', catalogPage);
}