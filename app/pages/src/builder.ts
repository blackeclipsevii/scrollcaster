import { ArmyUpgrades } from "../../shared-lib/ArmyUpgrades.js";
import BattleTacticCardInterf from "../../shared-lib/BattleTacticCardInterf.js";
import OptionSet from "../../shared-lib/Options.js";
import RosterInterf, { RegimentInterf } from "../../shared-lib/RosterInterface.js";
import UnitInterf, { EnhancementSlotInterf } from "../../shared-lib/UnitInterface.js";
import UpgradeInterf from "../../shared-lib/UpgradeInterface.js";
import { endpoint } from "../../lib/endpoint.js";
import { copyToClipboard } from "../../lib/functions/copyToClipboard.js";
import { exportRoster } from "../../lib/functions/exportRoster.js";
import { getVar } from "../../lib/functions/getVar.js";
import { displayPoints, dynamicPages, unitTotalPoints } from "../../lib/host.js";
import { fetchWithLoadingDisplay } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";
import { putRoster } from "../../lib/RestAPI/roster.js";
import { unitsApi } from "../../lib/RestAPI/units.js";
import { fetchUpgrades } from "../../lib/RestAPI/upgrades.js";
import { CallbackMap, ContextMenu } from "../../lib/widgets/contextMenu.js";
import { displayPointsOverlay, refreshPointsOverlay, updateValidationDisplay } from "../../lib/widgets/displayPointsOverlay.js";
import { displayTacticsOverlay } from "../../lib/widgets/displayTacticsOverlay.js";
import { displayRorOverlay, displayUpgradeOverlay } from "../../lib/widgets/displayUpgradeOverlay.js";
import { displayWeaponOverlay } from "../../lib/widgets/displayWeaponOverlay.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { dynamicGoTo, setHeaderTitle, Settings, updateHeaderContextMenu } from "../../lib/widgets/header.js";
import { makeSelectableItemName, makeSelectableItemType } from "../../lib/widgets/helpers.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { Overlay } from "../../lib/widgets/overlay.js";
import { BattleSettings } from "./battle.js";
import { TacticsSettings } from "./tactics.js";
import { UnitSettings } from "./units.js";
import { UpgradeSettings } from "./upgrades.js";
import { WarscrollSettings } from "./warscroll.js";
import LoreInterf from "../../shared-lib/LoreInterface.js";
import { UnitType } from "../../shared-lib/UnitInterface.js";
import { BasicObject, Costed, Identifiable, Typed } from "../../shared-lib/BasicObject.js";

import UnitSlot, {toggleUnitAddButton} from "../../lib/widgets/builder/UnitSlot.js";

export class BuilderSettings implements Settings{
    [name: string]: unknown;
    roster: RosterInterf;
    constructor(roster: RosterInterf) {
        this.roster = roster;
    }
};

const builderPage = {
    settings: null as BuilderSettings | null,
    _cache: {
        upgrades: {
            upgrades: null as ArmyUpgrades | null,
            armyName: null as string | null
        },
        units: {
            units: null as UnitInterf | null,
            armyName: null as string | null,
            leaderId: null as string | null
        }
    },
    async fetchUpgrades() {
        const roster = this.settings!!.roster;

        if(this._cache.upgrades.upgrades && this._cache.upgrades.armyName === roster.army)
            return this._cache.upgrades.upgrades;
        const result = await fetchUpgrades(roster.army) as ArmyUpgrades | null;
        if (result){
            this._cache.upgrades.upgrades = result;
            this._cache.upgrades.armyName = roster.army;
        }
        return result;
    },
    async loadPage(settings: Settings) {
        if (!settings) {
            throw 'builder requires settings';
        }
        const thisPage = this;
        thisPage.settings = settings as BuilderSettings;

        const roster = thisPage.settings.roster;

        // Update the points display before removing a pointed object (obj.points)
        const removeObjectPoints = (pointedObj: {points: number}) => {
            refreshPointsOverlay(roster);
            updateValidationDisplay(roster);
        }

        const _newRegimentItem = () => {
            const div = document.createElement('div');
            div.innerHTML = `
            <span style="display: none;" class="regiment-idx"></span>
            <div class="regiment-header" style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="regiment-item-title"></span>
                <span class="regiment-item-points" style="margin-left:auto;"></span>
            </div>
            
            <!-- Content that will hold hero/units -->
            <div class="regiment-content" style="margin-top: 0.5rem;"></div>

            <!-- Add button below content -->
            <div style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                <button class="add-unit-button">Add Unit +</button>
            </div>
            `;
            div.className = `regiment-item`;
            const btn = div.querySelector(`button`) as HTMLButtonElement;
            btn.onclick = () => {
                const parent = div;
                const idx = Number(parent.id.substring(parent.id.length-1)) - 1;
                const content = parent.querySelector('.regiment-content') as HTMLElement;
                const count = content.children.length;

                const settings = new UnitSettings;
                settings.roster = roster;
                settings.regimentIndex = idx;
                if (count === 0)
                    settings.type = 'hero';

                dynamicGoTo(settings);
            };
            return div;
        }

        function clonePrototype(id: string, newId = '') {
            if (id.includes('unit'))
                throw new Error('clone prototype is no longer used for unit slot.');
            const newUsItem = _newRegimentItem();
            newUsItem.id = newId;
            return newUsItem;
        }

        const exportListAndDisplay = Overlay.toggleFactory('block', async () =>{
            const text = await exportRoster(roster);
            const modal = document.querySelector(".modal") as HTMLElement;

            const section = document.createElement('textarea');
            section.innerHTML = text;
            section.style.height = '30em';
            section.style.width = '95%';
            section.style.fontSize = '14px';

            const copyButton = document.createElement('button');
            copyButton.className = 'full-rectangle-button';
            copyButton.textContent = 'Copy to Clipboard';
            copyButton.onclick = () => {
                copyToClipboard(text);
                Overlay.disable();
            };

            modal.appendChild(section);
            modal.appendChild(copyButton);
        });

        function removeSection(section: HTMLElement, className: string) {
            const child = section.querySelector(`.${className}`) as HTMLElement | null;
            if (child && child.parentElement) {
                child.parentElement.removeChild(child);
            } else {
                console.log (`failed to remove ${className}`)
            }
        }

        async function createUnitSlot(parent: HTMLElement, 
                                      unit: UnitInterf | BattleTacticCardInterf | UpgradeInterf | LoreInterf, 
                                      idx: number, 
                                      callbackMap: CallbackMap | string, 
                                      onclick: (this: HTMLElement, ev: MouseEvent) => any, isUnit: boolean): Promise<UnitSlot | null> {
            if (!unit)
                return null;

            const unitSlot = new UnitSlot(parent, unit);
            unitSlot.setUnitIndex(idx);
            let displayDrawer = false;
            
            const canBeGeneral = unit.type === UnitType.Hero && parent.className.includes('regiment');
            if (canBeGeneral) {
                displayDrawer = true;
                unitSlot.addGeneralLabel(roster, unit as UnitInterf);
            }

            if ((unit as UnitInterf).canBeReinforced) {
                displayDrawer = true;
                unitSlot.addReinforcedLabel(roster, unit as UnitInterf);
            }

            if ((unit as UnitInterf).enhancements) {
                const allUpgrades = await thisPage.fetchUpgrades();
                if (allUpgrades) {
                    const enhancementNames = Object.getOwnPropertyNames((unit as UnitInterf).enhancements);
                    if (enhancementNames.length > 1)
                        enhancementNames.sort((a,b) => a.localeCompare(b));
                    for (let e = 0; e < enhancementNames.length; ++e) {
                        displayDrawer = true;
                        await unitSlot.displayEnhancements(roster, (unit as UnitInterf), enhancementNames[e], allUpgrades);
                    }
                }
            }

            if ((unit as UnitInterf).optionSets) {
                (unit as UnitInterf).optionSets.forEach(optionSet => {
                    displayDrawer = true;
                    unitSlot.displayWarscrollOption(roster, unit as UnitInterf, optionSet);
                });
            }
            
            if ((unit as UnitInterf).models) {
                (unit as UnitInterf).models.forEach(model => {
                    model.optionSets.forEach(optionSet => {
                        displayDrawer = true;
                        unitSlot.displayWarscrollOption(roster, unit as UnitInterf, optionSet);
                    });
                });
            }

            if (displayDrawer) {
                unitSlot.enableDrawer();
            } else {
                unitSlot.disableDrawer();
            }

            if (unit.superType !== 'Other')
                unitSlot.displayPoints(unit as BasicObject);

            if (typeof callbackMap === 'string') {
                const regItem = parent.closest('.regiment-item') as HTMLElement;
                if (regItem) {
                    const _div = regItem.querySelector('.regiment-idx') as HTMLElement;
                    const _currentRegIdx = Number(_div.textContent);
                    toggleUnitAddButton(regItem, roster.regiments[Number(_currentRegIdx)]);
                }
                
                callbackMap = {};
                callbackMap.Duplicate = async () => {
                    const regItem = parent.closest('.regiment-item') as HTMLElement;
                    const _div = regItem.querySelector('.regiment-idx') as HTMLElement;
                    const _currentRegIdx = Number(_div.textContent);

                    const reg = roster.regiments[Number(_currentRegIdx)];
                    const clone = JSON.parse(JSON.stringify(unit));
                    reg.units.push(clone);
                    putRoster(roster);
                    
                    toggleUnitAddButton(regItem, reg);

                    await createUnitSlot(parent, clone, reg.units.length-1, 'foo', onclick, isUnit);
                    refreshPointsOverlay(roster);
                    updateValidationDisplay(roster);
                };

                callbackMap.Delete = async () => {
                    // get the regiment index, dont assume it hasnt changed
                    const regItem = parent.closest('.regiment-item') as HTMLElement;
                    let _div = regItem.querySelector('.regiment-idx') as HTMLElement;
                    const _currentRegIdx = Number(_div.textContent);

                    // get the unit index, don't assume it hasn't changed
                    _div = unitSlot._unitSlot.querySelector('.unit-idx') as HTMLElement;
                    const _currentIdx = Number(_div.textContent);

                    // remove from the object
                    if (_currentIdx === -1) {
                        roster.regiments[_currentRegIdx].leader = null;
                    } else {
                        roster.regiments[_currentRegIdx].units.splice(_currentIdx, 1);
                    }
                    putRoster(roster);
                    
                    toggleUnitAddButton(regItem, roster.regiments[_currentRegIdx]);

                    // update the points
                    refreshPointsOverlay(roster);
                    updateValidationDisplay(roster);

                    // remove the div and move all of the other unit indices
                    parent.removeChild(unitSlot._unitSlot);
                    const slots = parent.querySelectorAll('.unit-slot');
                    slots.forEach((slot, newIdx) => {
                        const hiddenIdx = slot.querySelector('.unit-idx') as HTMLElement;
                        hiddenIdx.textContent = `${newIdx}`;
                    });
                    toggleUnitAddButton(parent, roster.regiments[_currentRegIdx]);
                }
            }

            if (callbackMap) {
                unitSlot.initializeContextMenu(callbackMap);
            }

            unitSlot.setOnClick(onclick);
            unitSlot.attachAndDisplay();
            return unitSlot;
        }

        async function displayRegimentOfRenown() {
            const regiment = roster.regimentOfRenown;
            if (!regiment)
                return;

            const regimentsDiv = document.getElementById('regiments-container') as HTMLElement;
            const newRegItem = clonePrototype('regiment-item-prototype');
            newRegItem.id = `regiment-item-of-renown`;

            const deadButton = newRegItem.querySelector('.add-unit-button');
            if (deadButton && deadButton.parentElement)
                deadButton.parentElement.removeChild(deadButton);

            const title = newRegItem.querySelector('.regiment-item-title') as HTMLElement;
            title.innerHTML = `Regiment of Renown`;

            const content = newRegItem.querySelector('.regiment-content') as HTMLElement;
            
            // slot for the ability
            const addRorAbility = () => {
                const unitSlot = new UnitSlot(content, regiment);
                unitSlot.enableDrawer();
                unitSlot.displayPoints(regiment);
                unitSlot.initializeContextMenu({});
                unitSlot.attachAndDisplay();
                
                unitSlot.setOnClick(() => {
                    displayRorOverlay(regiment);
                });

                return unitSlot.getDetails();
            }

            const details = addRorAbility();

            const _createUnitSlot = async (unit: UnitInterf) => {
                const unitSlot = new UnitSlot(details, unit);
                unitSlot.initializeContextMenu({});
                unitSlot.disableDrawer();
                unitSlot.attachAndDisplay();

                unitSlot.setOnClick(() => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
                });
            }

            for (let i = 0; i < regiment.unitContainers.length; ++i) {
                const unitContainer = regiment.unitContainers[i];
                for (let j = 0; j < unitContainer.min; ++j)
                    await _createUnitSlot(unitContainer.unit);
            }

            const pointsSpan = newRegItem.querySelector('.regiment-item-points') as HTMLElement;
            displayPoints(pointsSpan, regiment.points, 'pts');

            const callbackMap = {
                Delete: async () => {
                    removeObjectPoints(regiment);
                    roster.regimentOfRenown = null;
                    putRoster(roster);
                    regimentsDiv.removeChild(newRegItem);
                }
            };

            const menu = ContextMenu.create(callbackMap);
            const regHdr = newRegItem.querySelector(".regiment-header") as HTMLElement;
            regHdr.appendChild(menu);

            newRegItem.removeAttribute('style');
            regimentsDiv.appendChild(newRegItem);
            refreshPointsOverlay(roster);
        }

        async function displayRegiment(index: number) {
            const regimentsDiv = document.getElementById('regiments-container') as HTMLElement;
            const regiment = roster.regiments[index];
            const newRegItem = clonePrototype('regiment-item-prototype');
            newRegItem.id = '';

            const setInternalIdx = (_regItem: HTMLElement, _index: number) => {
                const hiddenIdx = _regItem.querySelector('.regiment-idx') as HTMLElement;
                hiddenIdx.textContent = `${_index}`;
                _regItem.id = `regiment-item-${_index+1}`;
                const title = _regItem.querySelector('.regiment-item-title') as HTMLElement;
                title.innerHTML = `Regiment ${_index+1}`;
            }

            setInternalIdx(newRegItem, index);

            const content = newRegItem.querySelector('.regiment-content') as HTMLElement;

            let points = 0;
            if (regiment.leader) {
                await createUnitSlot(content, regiment.leader, -1, 'defaults', () => {
                    const settings = new WarscrollSettings;
                    settings.unit = regiment.leader;
                    dynamicGoTo(settings);
                }, true);
                points += unitTotalPoints(regiment.leader);
            } else {
                const btn = newRegItem.querySelector('.add-unit-button') as HTMLButtonElement;
                btn.textContent = 'Add Leader +';
            }

            for(let i = 0; i < regiment.units.length; ++i) {
                const unit = regiment.units[i];
                
                await createUnitSlot(content, unit, i, 'defaults', () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
                }, true);
                points += unitTotalPoints(unit);
            };

            const pointsSpan = newRegItem.querySelector('.regiment-item-points') as HTMLElement;
            if (points > 0) {
                pointsSpan.textContent = `${points} pts`;
            }

            const callbackMap = {
                Duplicate: async () => {
                    const _div = newRegItem.querySelector('.regiment-idx') as HTMLElement;
                    const _currentIdx = Number(_div.textContent);
                    const reg = roster.regiments[_currentIdx];
                    const clone = JSON.parse(JSON.stringify(reg));
                    roster.regiments.push(clone);
                    putRoster(roster);
                    displayRegiment(roster.regiments.length-1);
                    updateValidationDisplay(roster);

                    if (roster.regiments.length > 4) {
                        const btn = document.getElementById('regiments-add-button') as HTMLButtonElement;
                        btn.disabled = true;
                    }
                },

                Delete: async () => {
                    const _div = newRegItem.querySelector('.regiment-idx') as HTMLElement;
                    const _currentIdx = Number(_div.textContent);
                    const reg = roster.regiments[_currentIdx];
                    roster.regiments.splice(_currentIdx, 1);
                    putRoster(roster);
                    refreshPointsOverlay(roster);
                    updateValidationDisplay(roster);

                    // remove this regiment
                    regimentsDiv.removeChild(newRegItem);

                    // update remaining regiments
                    const divs = regimentsDiv.querySelectorAll('.regiment-item') as NodeListOf<HTMLElement>;
                    divs.forEach((div, idx)=> {
                        setInternalIdx(div, idx);
                    });
                    
                    if (roster.regiments.length < 5) {
                        const btn = document.getElementById('regiments-add-button') as HTMLButtonElement;
                        btn.disabled = false;
                    }
                }
            };

            const menu = ContextMenu.create(callbackMap);
            const regHdr = newRegItem.querySelector(".regiment-header") as HTMLElement;
            regHdr.appendChild(menu);

            newRegItem.removeAttribute('style');
            regimentsDiv.appendChild(newRegItem);

            refreshPointsOverlay(roster);
        }

        async function getSpecificUnit(id: string, useArmy: boolean) {
            let url = `${endpoint}/units?id=${id}`;
            if (useArmy) {
                url = `${url}&army=${roster.army}`;
            }

            try {
                const result = await fetchWithLoadingDisplay(encodeURI(url));
                return result;
            } catch (error) {
                return null;
            }
        }

        async function getManifestationUnits() {
            if (!roster.lores.manifestation)
                return null;

            const ids = roster.lores.manifestation.unitIds;
            let manifestations: UnitInterf[] = [];
            let armySpecific = false;
            for (let i = 0; i < ids.length; ++i) {
                let unit = await getSpecificUnit(ids[i], armySpecific);
                if (!unit) {
                    armySpecific = !armySpecific;
                    unit = await getSpecificUnit(ids[i], armySpecific);
                }

                if (unit)
                    manifestations.push(unit);
            }
            return { units: manifestations, armyUnits: armySpecific };
        }

        function displaySingleton(typename: string,
                                  callbackMap: CallbackMap,
                                  unit: UnitInterf | UpgradeInterf,
                                  idx: number,
                                  onclick: (this: HTMLElement, ev: MouseEvent) => any,
                                  isUnit: boolean) {
            const parent = document.getElementById(typename);
            if (!parent)
                return;
            
            createUnitSlot(parent, unit, idx, callbackMap, onclick, isUnit);
            refreshPointsOverlay(roster);
            updateValidationDisplay(roster);
        }

        function displayAux(idx: number) {
            const typename = 'auxiliary-units-container';
            const unit = roster.auxiliaryUnits[idx];
            const onclick = () => {
                const settings = new WarscrollSettings;
                settings.unit = unit;
                dynamicGoTo(settings);
            };
            
            const callbackMap = {
                Duplicate: async () => {
                    const clone = JSON.parse(JSON.stringify(unit));
                    roster.auxiliaryUnits.push(clone);
                    putRoster(roster);
                    displayAux(roster.auxiliaryUnits.length-1);
                },

                Delete: async () => {
                    if (roster.auxiliaryUnits.length === 1)
                        roster.auxiliaryUnits = []
                    else
                        roster.auxiliaryUnits.splice(idx, 1);
                    putRoster(roster);

                    if (roster.auxiliaryUnits.length === 0) {
                        refreshPointsOverlay(roster);
                        updateValidationDisplay(roster);
                    }
                    
                    const parent = document.getElementById(typename) as HTMLElement;
                    parent.innerHTML = '';
                    for (let i = 0; i < roster.auxiliaryUnits.length; ++i)
                        displayAux(i);
                }
            };

            displaySingleton(typename, callbackMap, unit, idx, onclick, true);
        }

        function displayTerrain() {
            const typename = 'faction-terrain-container';
            const onclick = () => {
                const settings = new WarscrollSettings;
                settings.unit = roster.terrainFeature;
                dynamicGoTo(settings);
            };

            const callbackMap = {
                Replace: async () => {
                    roster.terrainFeature = null;
                    putRoster(roster);
                    const settings = new UnitSettings;
                    settings.roster = roster;
                    settings.type = 'faction terrain';
                    dynamicGoTo(settings);
                },

                Delete: async () => {
                    if (roster.terrainFeature) {
                        removeObjectPoints(roster.terrainFeature);
                        roster.terrainFeature = null;
                        await putRoster(roster);
                        const terrain = document.getElementById('faction-terrain-container') as HTMLElement;
                        terrain.innerHTML = '';
                        const btn = document.getElementById('faction-terrain-add-button') as HTMLButtonElement;
                        btn.disabled = false;
                    }
                }
            };

            if (roster.terrainFeature) {
                displaySingleton(typename, callbackMap, roster.terrainFeature, 0, onclick, true);
                const btn = document.getElementById('faction-terrain-add-button') as HTMLButtonElement;
                btn.disabled = true;
            }
        }

        function displayBattleTraits() {
            const typename = 'battle-traits-&-formation-container';
            const traitNames = Object.getOwnPropertyNames(roster.battleTraits);
            const trait = roster.battleTraits[traitNames[0]];
            const onclick = () => {
                displayUpgradeOverlay(trait);
            };
            const parent = document.getElementById(typename) as HTMLElement;
            const unitSlot = new UnitSlot(parent, trait);
            unitSlot.disableDrawer();
            unitSlot.initializeContextMenu({});
            unitSlot.setOnClick(onclick);
            
            const usName = unitSlot._unitSlot.querySelector('.unit-text') as HTMLElement;
            usName.textContent = trait.name.replace("Battle Traits: ", "");

            const label = unitSlot._unitSlot.querySelector('.ability-label') as HTMLElement;
            label.textContent = 'Battle Traits';

            unitSlot.attachAndDisplay();
            

            // const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
            // usPoints.style.display = 'none';
            // usPoints.innerHTML = '';
        }

        function displayBattleFormation() {
            const typename = 'battle-traits-&-formation-container';
            const onclick = () => {
                displayUpgradeOverlay(roster.battleFormation);
            }
            
            const callbackMap = {
                Replace: async () => {
                    roster.battleFormation = null;
                    putRoster(roster);
                    const settings = new UpgradeSettings;
                    settings.titleName = 'Battle Formation';
                    settings.roster = roster;
                    settings.type = 'battleFormations';
                    dynamicGoTo(settings);
                }
            };

            if (roster.battleFormation)
                displaySingleton(typename, callbackMap, roster.battleFormation, 900, onclick, false);
        }

        async function displayLore(name: string, callbackMap: CallbackMap, onclick: (this: HTMLElement, ev: MouseEvent) => any) {
            const typename = 'lores-container';
            const lcName = name.toLowerCase();
            const parent = document.getElementById(typename);
            if (!parent)
                return;

            const indexedLores =  (roster.lores as unknown as {[name: string]: LoreInterf});

            const slot = await createUnitSlot(parent, indexedLores[lcName], 0, callbackMap, onclick, false);
            if (slot)
                slot._unitSlot.id = `${lcName}-slot`;

            const unitsPoints = indexedLores[lcName].points;
            if (unitsPoints) {
                refreshPointsOverlay(roster);
                updateValidationDisplay(roster);
            }
        }

        function displaySpellLore() {
            const onclick = () => {
                displayUpgradeOverlay(roster.lores.spell);
            }

            const callbackMap = {
                Replace: async () => {
                    if (roster.lores.spell)
                        removeObjectPoints(roster.lores.spell);

                    roster.lores.spell = null;
                    putRoster(roster);
                    
                    const settings = new UpgradeSettings;
                    settings.titleName = 'Lores';
                    settings.roster = roster;
                    settings.type = 'spellLore';
                    dynamicGoTo(settings);
                },

                Delete: async () => {
                    if (roster.lores.spell)
                        removeObjectPoints(roster.lores.spell);

                    roster.lores.spell = null;
                    await putRoster(roster);
                    
                    const ele = document.getElementById('spell-slot');
                    if (ele && ele.parentElement)
                        ele.parentElement.removeChild(ele);

                }
            };
            
            displayLore('Spell', callbackMap, onclick);
        }

        function displayPrayerLore() {
            const onclick = () => {
                displayUpgradeOverlay(roster.lores.prayer);
            }

            const callbackMap = {
                Replace: async () => {
                    if (roster.lores.prayer)
                        removeObjectPoints(roster.lores.prayer);

                    roster.lores.prayer = null;
                    putRoster(roster);

                    const settings = new UpgradeSettings;
                    settings.titleName = 'Lores';
                    settings.roster = roster;
                    settings.type = 'prayerLore';
                    dynamicGoTo(settings);
                },

                Delete: async () => {
                    if (roster.lores.prayer)
                        removeObjectPoints(roster.lores.prayer);

                    roster.lores.prayer = null;
                    await putRoster(roster);
                    
                    const ele = document.getElementById('prayer-slot');
                    if (ele && ele.parentElement)
                        ele.parentElement.removeChild(ele);
                }
            };

            displayLore('Prayer', callbackMap, onclick);
        }

        async function displayManifestLore() {
            const lore = roster.lores.manifestation;
            if (!lore)
                return;

            const parent = document.getElementById('lores-container') as HTMLElement;
            const manLoreSlot = new UnitSlot(parent, lore);
            manLoreSlot.setOnClick(() => {
                displayUpgradeOverlay(roster.lores.manifestation);
            });
            manLoreSlot.enableDrawer();

            async function displayManifestations() {
                const result = await getManifestationUnits();
                if (!result)
                    return;

                const details = manLoreSlot.getDetails();

                const createManifestSlot = async (unit: UnitInterf, onclick: (this: GlobalEventHandlers, ev: MouseEvent) => any) => {
                    const subUnitSlot = new UnitSlot(details, unit);
                    subUnitSlot.disableDrawer();
                    subUnitSlot.displayPoints(unit);
                    subUnitSlot.initializeContextMenu({});
                    subUnitSlot.setOnClick(onclick);
                    subUnitSlot.attachAndDisplay();
                }

                for(let i = 0; i < result.units.length; ++i) {
                    const unit = result.units[i];
                    await createManifestSlot(unit, () => {
                        const settings = new WarscrollSettings;
                        settings.unit = unit;
                        dynamicGoTo(settings);
                    });
                }
            }
            
            const usName = manLoreSlot._unitSlot.querySelector('.unit-text') as HTMLElement;
            usName.textContent = lore.name;
            manLoreSlot.displayPoints(lore);

            refreshPointsOverlay(roster);
            updateValidationDisplay(roster);

            const callbackMap = {
                Delete: async () => {
                    if (roster.lores.manifestation) {
                        removeObjectPoints(roster.lores.manifestation);
                        roster.lores.manifestation = null;
                        putRoster(roster);
                        parent.removeChild(manLoreSlot._unitSlot);
                    }
                }
            };

            manLoreSlot.initializeContextMenu(callbackMap);
            
            displayManifestations();

            manLoreSlot.attachAndDisplay();
        }

        async function displayTactics() {
            const typename = 'battle-tactics-container';
            const parent = document.getElementById(typename) as HTMLElement;
            for (let i = 0; i < roster.battleTacticCards.length; ++i) {
                const tactic = roster.battleTacticCards[i];

                const onclick = () => {
                    displayTacticsOverlay(tactic);
                }
                
                const callbackMap = {
                    Replace: async () => {
                        roster.battleTacticCards.splice(i, 1);
                        putRoster(roster);
                        const settings = new TacticsSettings;
                        settings.roster = roster;
                        dynamicGoTo(settings);
                    },

                    Delete: async () => {
                        if(roster.battleTacticCards.length == 2)
                            roster.battleTacticCards.splice(i, 1);
                        else
                            roster.battleTacticCards = [];
                        await putRoster(roster);

                        const slots = parent.querySelectorAll('.unit-slot');
                        slots.forEach(slot => {
                            const hiddenIdx = slot.querySelector('.unit-idx') as HTMLElement;
                            if (i === Number(hiddenIdx.textContent)) {
                                parent.removeChild(slot);
                            }
                        });
                    }
                };

                const unitSlot = await createUnitSlot(parent, tactic, i, callbackMap, onclick, false);
                if (unitSlot) {
                    const label = unitSlot._unitSlot.querySelector('.ability-label') as HTMLElement;
                    label.textContent = 'Battle Tactic Card';
                }
            }
        }

        async function loadArmy(doGet: boolean) {
            if (doGet) {
                if (roster.isArmyOfRenown) {
                    const btn = document.getElementById('battle-traits-&-formation-add-button') as HTMLButtonElement;
                    btn.disabled = true;
                }
                displayPointsOverlay();
                refreshPointsOverlay(roster);
            }

            const upgrades = await thisPage.fetchUpgrades();
            const sections = document.querySelectorAll('.section-container');
            sections.forEach(section => section.innerHTML = '');

            for (let i = 0; i < roster.regiments.length; ++i)
                await displayRegiment(i);

            if (roster.regimentOfRenown)
                displayRegimentOfRenown();

            if ((roster.regiments.length + (roster.regimentOfRenown ? 1 : 0)) >= 5) {
                const btn = document.getElementById('regiments-add-button') as HTMLButtonElement;
                btn.disabled = true;
            }

            for (let i = 0; i< roster.auxiliaryUnits.length; ++i)
                displayAux(i);

            if (roster.terrainFeature) {
                displayTerrain();
            } else {
                const result = await unitsApi.get(roster.army);
                if (result) {
                    const units = Object.values(result);
                    const terrain = units.some(unit => unit.type === UnitType.Terrain);
                    if (!terrain) {
                        const terrainSection = document.getElementById('faction-terrain-section') as HTMLElement;
                        const tb = terrainSection.querySelector('button') as HTMLButtonElement;
                        tb.disabled = true;
                    }
                }
            }

            displayBattleTraits();

            if (roster.battleFormation) 
                displayBattleFormation();

            if (roster.lores.spell)
                displaySpellLore();

            if (roster.lores.prayer)
                displayPrayerLore();

            if (roster.lores.manifestation)
                displayManifestLore();

            if (roster.battleTacticCards.length > 0)
                displayTactics();
            
            setHeaderTitle(roster.name);
            refreshPointsOverlay(roster);
            updateValidationDisplay(roster);
        }

        const armyLoadPage = async () => {
            const factory = (main: HTMLElement, name: string, show: boolean) => {
                const adjustedName = name.toLowerCase().replace(/ /g, '-');
                const section = document.createElement('div');
                // section.style.display = 'none';
                section.className = 'section draggable';
                section.id = `${adjustedName}-section`;
                section.innerHTML = `
                    <div class="draggable-grip-wrapper">
                        <div class="draggable-grip">
                            <span class="grip-icon">⋮⋮⋮</span>
                            <h3 id="${adjustedName}-section-title" class="section-title">${name}</h3>
                        </div>
                        <button id="${adjustedName}-add-button" class="rectangle-button">+</button>
                    </div>
                    
                    <div class="section-container" id="${adjustedName}-container"></div>
                `;
                main.appendChild(section);

                const btn = document.getElementById(`${adjustedName}-add-button`) as HTMLElement;
                btn.onclick = async () => {
                    if (adjustedName === 'regiments') {
                        let nRegiments = (roster.regimentOfRenown ? 1 : 0) + roster.regiments.length;
                        if (nRegiments < 5) {
                            roster.regiments.push({ leader: null, units: [] });
                            const idx = roster.regiments.length - 1;
                            // displayRegiment(idx);
                            await putRoster(roster);

                            // automatically go to adding a leader
                            const settings = new UnitSettings;
                            settings.roster = roster;
                            settings.regimentIndex = idx;
                            settings.type = 'hero';
                            dynamicGoTo(settings);
                        }
                    } 
                    else if (adjustedName.includes('auxiliary')) {
                        const settings = new UnitSettings;
                        settings.roster = roster;
                        settings.auxiliary = true;
                        dynamicGoTo(settings);
                    }
                    else if (adjustedName.includes('lores')) {
                        const settings = new UpgradeSettings;
                        settings.titleName = 'Lores';
                        settings.roster = roster;
                        settings.type = 'lore';
                        dynamicGoTo(settings);
                    }
                    else if (adjustedName.includes('formation')) {
                        const settings = new UpgradeSettings;
                        settings.titleName = 'Battle Formation';
                        settings.type = 'battleFormations';
                        settings.roster = roster;
                        dynamicGoTo(settings);
                    }
                    else if (adjustedName.includes('terrain')) {
                        if (!roster.terrainFeature) {
                            const settings = new UnitSettings;
                            settings.roster = roster;
                            settings.type = 'faction terrain';
                            dynamicGoTo(settings);
                        }
                    }
                    else if (adjustedName.includes('tactic')) {
                        const settings = new TacticsSettings;
                        settings.roster = roster
                        dynamicGoTo(settings);
                    }
                    else {
                        alert(`Add new item to ${section}`);
                    }
                }
                return section;
            } 

            const sections = [
                'Regiments',
                'Auxiliary Units',
                'Battle Traits & Formation',
                'Lores',
                'Battle Tactics',
                'Faction Terrain'
            ];

            updateHeaderContextMenu({
                'Battle View': () => {
                    const bvs = new BattleSettings;
                    bvs.roster = roster;
                    dynamicGoTo(bvs);
                },
                'Export List': exportListAndDisplay 
            });
            makeLayout(sections, factory);

            const isConfig = [
                'battle-traits-&-formation', 'faction-terrain',
                'lores', 'battle-tactics'
            ];
            isConfig.forEach(sectionName => {
                let btn = document.getElementById(`${sectionName}-add-button`) as HTMLElement;
                btn.textContent = '⚙︎';
            })

            await loadArmy(true);
            swapLayout();
            initializeDraggable('builder');
        }

        await armyLoadPage();
    }
};

dynamicPages['builder'] = builderPage;