import { displayPoints, dynamicPages } from "../../lib/host.js";
import { endpoint } from "../../lib/endpoint.js";
import { fetchArmies, fetchWithLoadingDisplay } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";
import { disableBackButton, dynamicGoTo, enableBackButton, enableSearchButton, setHeaderTitle, Settings } from "../../lib/widgets/header.js";
import { makeSelectableItemName } from "../../lib/widgets/helpers.js";
import { UpgradeSettings } from "./upgrades.js";
import { TacticsSettings } from "./tactics.js";
import { UnitSettings } from "./units.js";
import { clearLayout, makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { hidePointsOverlay } from "../../lib/widgets/displayPointsOverlay.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { Force } from "../../../shared-lib/Force.js";
import { RegimentOfRenownSettings } from "./regimentOfRenown.js";
import ArmyInterf from "../../../shared-lib/ArmyInterface.js";
import UpgradeInterf from "../../../shared-lib/UpgradeInterface.js";
import { displayUpgradeOverlay } from "../../lib/widgets/displayUpgradeOverlay.js";

interface RorLUT {
    [name: string]: Force;
}

export class CatalogSettings implements Settings{
    [name: string]: unknown;
    armyName = null as string | null;
    core = false;
    _doSub = true; // this is not intended for external use, just tracking history
};

const getArmySection = () => {
    return document.getElementById('army-section') as HTMLElement;
}

const catalogPage = {
    settings: new CatalogSettings,
    _cache: {
        armies: null,
        regimentsOfRenown: null as RorLUT | null
    },
    async fetchRegimentsOfRenown() {
        if (this._cache.regimentsOfRenown) {
            //return this._cache.regimentsOfRenown;
        }
        let result = await fetchWithLoadingDisplay(encodeURI(`${endpoint}/regimentsOfRenown`)) as RorLUT | null;
        this._cache.regimentsOfRenown = result;
        return result;
    },
    async loadPage(settings: Settings) {
        if (!settings)
            settings = new CatalogSettings;
        this.settings = settings as CatalogSettings;
        const thisPage = this;

        const alliancesVisible = (visible: boolean) => {
            getArmySection().style.display = visible ? 'none' : '';
            ['order', 'chaos', 'death', 'destruction'].forEach(type =>
            (document.getElementById(`${type}-section`) as HTMLElement).style.display = visible ? '' : 'none');
        }

        const coreVisible = (visible: boolean) => {
            visible ? disableBackButton() : enableBackButton();
            const sec = document.getElementById('core-section') as HTMLElement;
            sec.style.display = visible ? '' : 'none';
            alliancesVisible(visible);
        }
        
        const resetLists = () => {
            const lists = document.querySelectorAll('.item-list');
            lists.forEach(l => l.innerHTML = '');
        }
        
        const makeItem = (name: string, onclick: (this: HTMLDivElement, ev: MouseEvent) => any, listName = 'army-list', points: number | null = null) => {
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
            coreVisible(false);
            resetLists();
            const sections = document.getElementById('army-section') as HTMLElement;
            const h2 = sections.querySelector('.section-title') as HTMLHeadingElement;
            h2.textContent = 'Age of Sigmar';
        
            makeItem('Warscrolls', () => {
                dynamicGoTo((new UnitSettings) as unknown as Settings);
            });
            
            makeItem('Battle Tactic Cards', () => {
                dynamicGoTo(new TacticsSettings);
            });          
        
            makeItem('Lores', () => {
                const settings = new UpgradeSettings;
                (settings as unknown as Settings).type = 'lores';
                (settings as unknown as Settings).titleName = 'Lores';
                dynamicGoTo(settings as unknown as Settings);
            });
        }
        
        async function loadRor() {
            coreVisible(false);
            resetLists();
            const h2 = getArmySection().querySelector('.section-title') as HTMLHeadingElement;
            h2.textContent = 'Regiments of Renown';
        
            const unitsLUT = await thisPage.fetchRegimentsOfRenown();
            if (!unitsLUT)
                return;

            const units = Object.values(unitsLUT);
            units.forEach(regimentOfRenown => {
                makeItem(regimentOfRenown.name, () => {
                    const settings = new RegimentOfRenownSettings;
                    settings.ror = regimentOfRenown;
                    dynamicGoTo(settings);
                }, 'army-list', regimentOfRenown.points);
            });
        }
        
        async function loadTome() {
            coreVisible(false);
            resetLists();
            const h2 = getArmySection().querySelector('.section-title') as HTMLHeadingElement;
            h2.textContent = thisPage.settings.armyName;
        
            const _loadFaction = async (subFactionName: string) => {
                resetLists();
                const url = `${endpoint}/armies?army=${subFactionName}`;
                await fetchWithLoadingDisplay(encodeURI(url), (uk: unknown) => {
                    const army = uk as ArmyInterf;
                    h2.textContent = army.name;
        
                    if (Object.getOwnPropertyNames(army.units).length > 0) {
                        makeItem('Warscrolls', () => {
                            const settings = new UnitSettings;
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });
                    }
        
                    if (Object.getOwnPropertyNames(army.upgrades.battleTraits).length > 0) {
                        makeItem('Battle Traits', () => {
                            const names = Object.getOwnPropertyNames(army.upgrades.battleTraits);
                            const traits: UpgradeInterf[] = [];
                            names.forEach(name => {
                                traits.push(army.upgrades.battleTraits[name]);
                            })
                            displayUpgradeOverlay(traits);
                        });          
                    }
        
                    if (!army.isArmyOfRenown && army.upgrades.battleFormations) {
                        makeItem('Battle Formations', () => {
                            const settings = new UpgradeSettings;
                            settings.titleName = 'Battle Formation';
                            settings.type = 'battleFormations';
                            settings.armyName = subFactionName;
                            dynamicGoTo(settings);
                        });          
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
                            });   
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
                        });          
                    }
                });
            }
        
            if (thisPage.settings._doSub) {
                const subfactions: string[] = [];
                await fetchArmies(async (uk: unknown) => {
                    const armyAlliances = uk as {name: string, alliance: string}[];
                    armyAlliances.forEach(alliance => {
                        const army = alliance.name;
                        if (army.includes(thisPage.settings.armyName!!)) {
                            subfactions.push(army);
                        }
                    });
        
                    if (subfactions.length > 1) {
                         subfactions.every(army => {
                            if (!army.includes(' - ')) {
                                makeItem(army, () => {
                                    const settings = new CatalogSettings;
                                    settings.armyName = army;
                                    settings._doSub = false;
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
                                    settings._doSub = false;
                                    dynamicGoTo(settings, true, false); // update history but dont go
                                    thisPage.settings = settings;
                                    _loadFaction(army);
                                });
                            }
                        });
                    } else {
                        if (thisPage.settings.armyName)
                            _loadFaction(thisPage.settings.armyName);
                        else
                            console.log('expected army name');
                    }
                });
            } else {
                if (thisPage.settings.armyName)
                    _loadFaction(thisPage.settings.armyName);
                else
                    console.log('expected army name');
            }
        }
        
        async function loadArmies() {
            coreVisible(true);
            alliancesVisible(true);

            let item = makeItem('Age of Sigmar', async () => {
                const settings = new CatalogSettings;
                settings.core = true;
                dynamicGoTo(settings, true, false); // update history but dont go
                coreVisible(false);
                resetLists();
                thisPage.settings = settings;
                await loadCore();
            }, 'core-list');
            //let right = item.querySelector('.selectable-item-right');
            //let type = makeSelectableItemType('CORE');
            //right.appendChild(type);
            item = makeItem('Regiments of Renown', () => {
                const settings = new CatalogSettings;
                settings.armyName = 'ror';
                dynamicGoTo(settings, true, false); // update history but dont go
                coreVisible(false);
                resetLists();
                thisPage.settings = settings;
                loadRor();
            }, 'core-list');
            //right = item.querySelector('.selectable-item-right');
            //type = makeSelectableItemType('CORE');
            //right.appendChild(type);

            const loader = document.getElementById('armies-loader-box');
            //loader.style.display = 'block';

            await fetchArmies(async (uk: unknown) => {
                const alliances = uk as {name: string, alliance: string}[];
                alliances.forEach(alliance => {
                    const army = alliance.name;
                    if (army.includes(' - '))
                        return;

                    item = makeItem(army, () => {
                        const settings = new CatalogSettings;
                        settings.armyName = army;
                        dynamicGoTo(settings, true, false); // update history but dont go
                        coreVisible(false);
                        resetLists();
                        thisPage.settings = settings;
                        loadTome();
                    }, `${alliance.alliance.toLowerCase()}-list`);
                });
            });
        }
        
        const loadTomePage = async () => {
            const sections = [
                'Core', 'Army', 'Order', 'Chaos', 'Death', 'Destruction'
            ];
            if (document.getElementById('core-section')) {
                clearLayout();
            }
            makeLayout(sections);

            enableSearchButton();
            hidePointsOverlay();
            getArmySection().style.display = '';

            if (thisPage.settings.armyName)
                thisPage.settings.armyName === 'ror' ? await loadRor() : await loadTome();
            else if (thisPage.settings.core)
                await loadCore();
            else
                await loadArmies();
            
            swapLayout();
            initializeDraggable('catalog');
        }
        setHeaderTitle('Catalog');
        await loadTomePage();
    }
};

dynamicPages['catalog'] = catalogPage;