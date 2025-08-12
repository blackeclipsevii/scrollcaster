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
import { Costed, Identifiable, Typed } from "../../shared-lib/BasicObject.js";

var totalPoints = 0;

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
            totalPoints -= pointedObj.points;
            refreshPointsOverlay(roster);
            updateValidationDisplay(roster);
        }

        const disableArrow = (arrow: HTMLElement) => {
            const img = arrow.querySelector('img') as HTMLImageElement;
            img.src = `../resources/${getVar('ab-control')}`
            img.style.height = '.5em';
            img.style.width = '.5em';
            img.style.margin = '.75em';
            const wrapper = arrow.closest('.arrow-wrapper') as HTMLElement;
            wrapper.style.cursor = 'default';
        }

        const clearDetailsSection = (item: HTMLElement) => {
            removeSection(item, 'is-general');
            removeSection(item, 'is-reinforced');
        }

        const toggleUnitAddButton = (regItem: HTMLElement, _regiment: RegimentInterf) => {
            const btn = regItem.querySelector('.add-unit-button') as HTMLButtonElement;
            let maxUnits = 3;
            if ( _regiment.leader && _regiment.leader.isGeneral)
                maxUnits = 4;
            btn.disabled = (_regiment.units.length >= maxUnits) && _regiment.leader !== null;

            if (!_regiment.leader) {
                btn.textContent = 'Add Leader +';
                const leaderBtnColor = getVar('red-color');
                btn.style.borderColor = leaderBtnColor;
                btn.style.color = leaderBtnColor;
            }
        }

        function _addEnhancementUpgradeSection(newUsItem: HTMLElement, enhancement: EnhancementSlotInterf) {
            const div = document.createElement('div');
            div.classList.add('section');
            div.classList.add('upgrade-section');
            
            const h3 = document.createElement('h3');
            h3.className = 'section-title';
            h3.textContent = `${enhancement.name}:`;
            div.appendChild(h3);

            const details = newUsItem.querySelector('.unit-details') as HTMLElement;
            details.appendChild(div);
            return div;
        }

        function _newUnitSlot() {
            const unitSlot = document.createElement('div');

            unitSlot.innerHTML = `
                <span style="display: none;" class="unit-idx"></span>
                <div class='unit-slot-display-wrapper'>
                <div class='arrow-wrapper'>
                    <div class='arrow'>
                        <img class='invert-img' src='../resources/${getVar('right-arrow')}'></img>
                    </div>
                </div>
                <div class='unit-slot-selectable-item-wrapper'>
                    <div class="selectable-item unit-slot-selectable-item">
                        <div class="selectable-item-left">
                            <span class="general-label" style="display: none;">GENERAL</span>
                            <span class="reinforced-label" style="display: none;">REINFORCED</span>
                        </div>

                        <div class="selectable-item-right">
                            <div>
                            <span class="unit-slot-points points-label"></span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>

                <div class="unit-details">
                    <div class="section upgrade-section">
                        <label class="upgrade-label is-general">
                            <input type="checkbox" class="upgrade-checkbox general-checkbox"> General
                        </label>
                        <label class="upgrade-label is-reinforced">
                            <input type="checkbox" class="upgrade-checkbox reinforced-checkbox"> Reinforced
                        </label>
                    </div>
                </div>
            `
            
            unitSlot.className = `unit-slot`;
            return unitSlot;
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

        function updateSelectableItemPrototype(prototype: HTMLElement,
                                               displayableObj: Identifiable & Typed,
                                               isUnit: boolean,
                                               leftOnClick: (this: HTMLElement, ev: MouseEvent) => any) {
            const selectableItem = prototype.querySelector('.unit-slot-selectable-item-wrapper') as HTMLElement;
            selectableItem.addEventListener('click', leftOnClick);

            const nameEle = makeSelectableItemName(displayableObj);
            nameEle.classList.add('unit-text');

            const left = prototype.querySelector('.selectable-item-left') as HTMLElement;
            left.appendChild(nameEle);

            const roleEle = makeSelectableItemType(displayableObj, isUnit);

            left.insertBefore(roleEle, left.firstChild);
            left.insertBefore(nameEle, left.firstChild);
        }

        function clonePrototype(id: string, newId = '') {
            const newUsItem = id.includes('unit') ? _newUnitSlot() : _newRegimentItem();
            newUsItem.id = newId;
            if (id.includes('unit')) {
                newUsItem.style.padding = "0.4em";
               // newUsItem.style.background = "#ddd";
                newUsItem.style.marginBottom = "0.3rem";
                newUsItem.style.borderRadius = "4px";
            }
            return newUsItem;
        }

        const arrowOnClick = (arrow: HTMLElement, details: HTMLElement | null) => {
            if(!details)
                return;
            
            if (details.style.maxHeight) {
                details.style.maxHeight = '';
                arrow.style.transform = 'rotate(0deg)';
            } else {
                details.style.maxHeight = details.scrollHeight + "px";
                arrow.style.transform = 'rotate(90deg)';
            }
        }

        async function displayWarscrollOption(unit: UnitInterf, optionSet: OptionSet, newUsItem: HTMLElement) {
            const details = newUsItem.querySelector('.unit-details') as HTMLElement;
            const warOptDiv = document.createElement('div');
            warOptDiv.className = 'section upgrade-section';
            warOptDiv.innerHTML = `
                <h3 class="section-title">${optionSet.name}:</h3>
            `;
            const options = Object.values(optionSet.options);
            options.forEach(option => {
                const upgradeDiv = document.createElement('div');
                upgradeDiv.className = 'upgrade-group';
                upgradeDiv.innerHTML = `
                <div class='upgrade-group-left'>
                    <label class="upgrade-label">
                        <input type="checkbox" class="upgrade-checkbox">${option.name}
                    </label>
                </div>
                <div class='upgrade-group-right'>
                    <button class="upgrade-button">🔎</button>
                    <div style='display: inline-block' class='upgrade-points points-label'>${option.points} PTS</div>
                </div>`;

                const costsPoints = option.points && option.points > 0;
                if (!costsPoints) {
                    const pl = upgradeDiv.querySelector('.points-label')as HTMLElement;
                    pl.style.display = 'none';
                }

                const label = upgradeDiv.querySelector(`.upgrade-button`) as HTMLElement;
                label.onclick = () => {
                    if (option.weapons.length > 0) {
                        displayWeaponOverlay({
                            name: option.name,
                            weapons: option.weapons
                        });
                    }
                    
                    if (option.abilities.length > 0)
                        displayUpgradeOverlay(option);
                };

                if (option.weapons.length === 0 &&
                    option.abilities.length === 0) {
                    label.style.display = 'none';
                }

                const checkbox = upgradeDiv.querySelector(`.upgrade-checkbox`) as HTMLInputElement;
                if (optionSet.selection && optionSet.selection.name === option.name) {
                    checkbox.checked = true;
                }

                const handlechange = (points: number, subtract=false) => {
                    if (costsPoints) {
                        const unitPoints = unitTotalPoints(unit);
                        const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
                        displayPoints(usPoints, unitPoints, 'PTS');
                        if (subtract)
                            totalPoints -= points;
                        else
                            totalPoints += points;
                        refreshPointsOverlay(roster);
                    }
                    updateValidationDisplay(roster);
                    putRoster(roster);
                }

                checkbox.onchange = () => {
                    if (checkbox.checked) {
                        if (!optionSet.selection) {
                            optionSet.selection = option;
                            handlechange(option.points, false);
                        }
                        else if (optionSet.selection.name !== option.name) {
                            checkbox.checked = false;
                        }
                    } else {
                        if (optionSet.selection && optionSet.selection.name === option.name) {
                            optionSet.selection = null;
                            handlechange(option.points, true);
                        }
                    }
                };
                warOptDiv.appendChild(upgradeDiv);
            });
            details.appendChild(warOptDiv);
        }

        async function displayEnhancements(unit: UnitInterf, newUsItem: HTMLElement, type: string) {
            const details =  _addEnhancementUpgradeSection(newUsItem, unit.enhancements[type]);
            const allUpgrades = await thisPage.fetchUpgrades();
            if (!allUpgrades)
                return;
            const enhancementGroup = allUpgrades.enhancements[type];
            if (!enhancementGroup)
                return;

            const values = Object.values(enhancementGroup.upgrades);
            values.forEach(upgrade => {
                const upgradeDiv = document.createElement('div');
                upgradeDiv.className = 'upgrade-group';

                upgradeDiv.innerHTML = `
                <div class='upgrade-group-left'>
                <label class="upgrade-label">
                    <input type="checkbox" class="upgrade-checkbox">${upgrade.name}
                </label>
                </div>
                <div class='upgrade-group-right'>
                    <button class="upgrade-button">🔎</button>
                    <div style='display: inline-block' class='upgrade-points points-label'>${upgrade.points} PTS</div>
                </div>`;

                const costsPoints = upgrade.points && upgrade.points > 0;
                if (!costsPoints) {
                    const pl = upgradeDiv.querySelector('.points-label') as HTMLElement;
                    pl.style.display = 'none';
                }

                const label = upgradeDiv.querySelector(`.upgrade-button`) as HTMLElement;
                label.onclick = () => {
                    displayUpgradeOverlay(upgrade);
                };

                const checkbox = upgradeDiv.querySelector(`.upgrade-checkbox`) as HTMLInputElement;
                if (unit.enhancements[type].slot && unit.enhancements[type].slot.id === upgrade.id) {
                    checkbox.checked = true;
                }

                checkbox.onchange = () => {
                    if (checkbox.checked) {
                        if (!unit.enhancements[type].slot) {
                            unit.enhancements[type].slot = upgrade;
                            if (costsPoints) {
                                const unitPoints = unitTotalPoints(unit);
                                const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
                                displayPoints(usPoints, unitPoints, 'PTS');
                                totalPoints += upgrade.points;
                                refreshPointsOverlay(roster);
                            }
                            updateValidationDisplay(roster);
                            putRoster(roster);
                        } else if (unit.enhancements[type].slot.id !== upgrade.id) {
                            checkbox.checked = false;
                        }
                    } else {
                        if (unit.enhancements[type].slot && unit.enhancements[type].slot.id === upgrade.id) {
                            unit.enhancements[type].slot = null;
                            if (costsPoints) {
                                const unitPoints = unitTotalPoints(unit);
                                const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
                                displayPoints(usPoints, unitPoints, 'PTS');
                                removeObjectPoints(upgrade);
                            }
                            updateValidationDisplay(roster);
                            putRoster(roster);
                        }
                    }
                };
                details.appendChild(upgradeDiv);
            });
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
                                      onclick: (this: HTMLElement, ev: MouseEvent) => any, isUnit: boolean){
            if (!unit)
                return;
            const newUsItem = clonePrototype('unit-slot-prototype');
            
            const hiddenIdx = newUsItem.querySelector('.unit-idx') as HTMLElement;
            hiddenIdx.textContent = `${idx}`;

            let numOptions = 0;
            const canBeGeneral = !(unit.type !== UnitType.Hero || !parent.className.includes('regiment'));
            if (unit.type !== UnitType.Hero || !parent.className.includes('regiment')) {
                removeSection(newUsItem, 'is-general');
            } else {
                ++ numOptions;
                const checkbox = newUsItem.querySelector('.general-checkbox') as HTMLInputElement;
                checkbox.onchange = () => {
                    const unitContainer = checkbox.closest('.unit-slot') as HTMLElement;
                    const generalLabel = unitContainer.querySelector('.general-label') as HTMLElement;

                    generalLabel.style.display = checkbox.checked ? 'inline' : 'none';

                    let regiment = null;
                    let div = checkbox.closest(".regiment-item");
                    if (div) {
                        div = div.querySelector(".regiment-idx") as HTMLElement;
                        const regIdx = Number(div.textContent);
                        regiment = roster.regiments[regIdx];
                    }

                    let unit = null;
                    div = checkbox.closest(".unit-slot") as HTMLElement;
                    div = div.querySelector(".unit-idx") as HTMLElement;
                    const unitIdx = Number(div.textContent);
                    if (regiment) {
                        unit = unitIdx === -1 ? regiment.leader : regiment.units[unitIdx];
                    } else {
                        unit = roster.auxiliaryUnits[unitIdx];
                    }

                    unit!!.isGeneral = checkbox.checked;
                    putRoster(roster);
                    updateValidationDisplay(roster);

                    if (regiment) {
                        const regItem = parent.closest('.regiment-item') as HTMLElement;
                        toggleUnitAddButton(regItem, regiment);
                    }
                };
            }

            if (!(unit as UnitInterf).canBeReinforced) {
                if (!canBeGeneral) {
                    const child = newUsItem.querySelector(`.is-reinforced`) as HTMLElement;
                    const parentSection = child.closest('.section') as HTMLElement;
                    parentSection.style.display = 'none';
                }
                {
                    removeSection(newUsItem, 'is-reinforced');
                }
            } else {
                ++ numOptions;
                const checkbox = newUsItem.querySelector('.reinforced-checkbox') as HTMLInputElement;
                checkbox.onchange = () => {
                    const unitContainer = checkbox.closest('.unit-slot') as HTMLElement;
                    const reinLabel = unitContainer.querySelector('.reinforced-label') as HTMLElement;
                    reinLabel.style.display = checkbox.checked ? 'inline' : 'none';

                    let regiment = null;
                    let div = checkbox.closest(".regiment-item");
                    if (div) {
                        div = div.querySelector(".regiment-idx") as HTMLElement;
                        const regIdx = Number(div.textContent);
                        regiment = roster.regiments[regIdx];
                    }

                    let unit = null;
                    div = checkbox.closest(".unit-slot") as HTMLElement;
                    div = div.querySelector(".unit-idx") as HTMLElement;
                    const unitIdx = Number(div.textContent);
                    if (regiment) {
                        unit = unitIdx === -1 ? regiment.leader : regiment.units[unitIdx];
                    } else {
                        unit = roster.auxiliaryUnits[unitIdx];
                    }

                    const ptsBefore = unitTotalPoints(unit!!);
                    unit!!.isReinforced = checkbox.checked;
                    const ptsAfter = unitTotalPoints(unit!!);
                    putRoster(roster);

                    const usPoints = unitContainer.querySelector('.unit-slot-points') as HTMLElement;
                    usPoints.textContent = `${ptsAfter} PTS`;
                    totalPoints = totalPoints - (ptsBefore - ptsAfter);
                    refreshPointsOverlay(roster);
                    updateValidationDisplay(roster);
                };
            }

            if ((unit as UnitInterf).enhancements) {
                const enhancementNames = Object.getOwnPropertyNames((unit as UnitInterf).enhancements);
                if (enhancementNames.length > 1)
                    enhancementNames.sort((a,b) => a.localeCompare(b));
                for (let e = 0; e < enhancementNames.length; ++e) {
                    ++ numOptions;
                    await displayEnhancements((unit as UnitInterf), newUsItem, enhancementNames[e]);
                }
            }

            if ((unit as UnitInterf).optionSets) {
                (unit as UnitInterf).optionSets.forEach(optionSet => {
                    ++numOptions;
                    displayWarscrollOption((unit as UnitInterf), optionSet, newUsItem);
                });
            }
            
            // to-do display as part of the model
            if ((unit as UnitInterf).models) {
                (unit as UnitInterf).models.forEach(model => {
                    model.optionSets.forEach(optionSet => {
                        ++numOptions;
                        displayWarscrollOption((unit as UnitInterf), optionSet, newUsItem);
                    });
                });
            }

            if (numOptions < 1) {
                // remove drawer
                removeSection(newUsItem, "unit-details");
                const arrow = newUsItem.querySelector('.arrow') as HTMLElement;
                disableArrow(arrow);
            } else {
                const arrow = newUsItem.querySelector('.arrow') as HTMLElement;
                const wrapper = arrow.closest('.arrow-wrapper') as HTMLElement;
                wrapper.onclick = (event) => {
                    event.stopPropagation();
                    arrowOnClick(arrow, newUsItem.querySelector('.unit-details'));
                }
            }

            if ((unit as UnitInterf).isGeneral) {
                // Temporarily disable onchange event
                const icon = newUsItem.querySelector('.general-label') as HTMLElement;
                const checkbox = newUsItem.querySelector(`.general-checkbox`) as HTMLInputElement;
                const originalOnChange = checkbox.onchange;
                checkbox.onchange = null;

                // Set checkbox value
                checkbox.checked = true;
                icon.style.display = 'inline';

                // Restore onchange
                checkbox.onchange = originalOnChange;
            }

            if ((unit as UnitInterf).isReinforced) {
                // Temporarily disable onchange event
                const icon = newUsItem.querySelector('.reinforced-label') as HTMLElement;
                const checkbox = newUsItem.querySelector(`.reinforced-checkbox`) as HTMLInputElement;
                const originalOnChange = checkbox.onchange;
                checkbox.onchange = null;

                // Set checkbox value
                checkbox.checked = true;
                icon.style.display = 'inline';

                // Restore onchange
                checkbox.onchange = originalOnChange;
            }

            let unitPoints = 0;
            if (unit.superType === 'Unit')
                unitPoints = unitTotalPoints(unit as UnitInterf);
            else if (unit.superType !== 'Other')
                unitPoints = (unit as Costed).points;

            const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
            displayPoints(usPoints, unitPoints, 'PTS');

            let unitHdr = newUsItem.querySelector(".selectable-item-right") as HTMLElement;
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
                    totalPoints += unitTotalPoints(clone);
                    refreshPointsOverlay(roster);
                    updateValidationDisplay(roster);
                };

                callbackMap.Delete = async () => {
                    // get the regiment index, dont assume it hasnt changed
                    const regItem = parent.closest('.regiment-item') as HTMLElement;
                    let _div = regItem.querySelector('.regiment-idx') as HTMLElement;
                    const _currentRegIdx = Number(_div.textContent);

                    // get the unit index, don't assume it hasn't changed
                    _div = newUsItem.querySelector('.unit-idx') as HTMLElement;
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
                    removeObjectPoints(unit as UnitInterf);

                    // remove the div and move all of the other unit indices
                    parent.removeChild(newUsItem);
                    const slots = parent.querySelectorAll('.unit-slot');
                    slots.forEach((slot, newIdx) => {
                        const hiddenIdx = slot.querySelector('.unit-idx') as HTMLElement;
                        hiddenIdx.textContent = `${newIdx}`;
                    });
                    toggleUnitAddButton(parent, roster.regiments[_currentRegIdx]);
                }
            }
            if (callbackMap) {
                const menu = ContextMenu.create(callbackMap);
                unitHdr.appendChild(menu);
            }
            updateSelectableItemPrototype(newUsItem, unit, isUnit, onclick);
            parent.appendChild(newUsItem);
            newUsItem.style.display = "";
            return newUsItem;
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
                const newUsItem = clonePrototype('unit-slot-prototype');
                
                const arrow = newUsItem.querySelector('.arrow') as HTMLElement;
                const wrapper = arrow.closest('.arrow-wrapper') as HTMLElement
                wrapper.onclick = (event: Event) => {
                    event.stopPropagation();
                    arrowOnClick(arrow, newUsItem.querySelector('.unit-details'));
                }
                updateSelectableItemPrototype(newUsItem, regiment, true, () => {
                    displayRorOverlay(regiment);
                });

                // these are all for units
                clearDetailsSection(newUsItem);

                const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
                displayPoints(usPoints, regiment.points, 'PTS');

                let unitHdr = newUsItem.querySelector(".selectable-item-right") as HTMLElement;
                // does nothing but helps positioning be consistant
                const menu = ContextMenu.create({});
                unitHdr.appendChild(menu);

                content.appendChild(newUsItem);
                newUsItem.style.display = "";
                const details = newUsItem.querySelector('.unit-details') as HTMLElement;
                const detailSection = details.querySelector('.section') as HTMLElement;
                detailSection.style.display = 'none';
                return details;
            }

            const details = addRorAbility();

            const _createUnitSlot = async (unit: UnitInterf) => {
                const newUsItem = clonePrototype('unit-slot-prototype');
                
                updateSelectableItemPrototype(newUsItem, unit, true, () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
                });

                // remove toggle
                removeSection(newUsItem, "unit-details");
                const arrow = newUsItem.querySelector('.arrow') as HTMLElement;
                disableArrow(arrow);
        
                const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
                usPoints.style.display = 'none';
                usPoints.textContent = '';

                let unitHdr = newUsItem.querySelector(".selectable-item-right") as HTMLElement;
                // does nothing but helps positioning be consistant
                const menu = ContextMenu.create({});
                unitHdr.appendChild(menu);

            // detailsSection.appendChild(newUsItem);
                details.appendChild(newUsItem);
                newUsItem.style.display = "";
            }

            for (let i = 0; i < regiment.unitContainers.length; ++i) {
                const unitContainer = regiment.unitContainers[i];
                for (let j = 0; j < unitContainer.min; ++j)
                    await _createUnitSlot(unitContainer.unit);
            }

            const pointsSpan = newRegItem.querySelector('.regiment-item-points') as HTMLElement;
            displayPoints(pointsSpan, regiment.points, 'pts');
            totalPoints += regiment.points;

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
                totalPoints += points;
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
                    if (reg.leader)
                        totalPoints -= unitTotalPoints(reg.leader);
                    reg.units.forEach(unit => {
                        totalPoints -= unitTotalPoints(unit);
                    });
                    roster.regiments.splice(_currentIdx, 1);
                    putRoster(roster);
                    refreshPointsOverlay(roster);

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

            let unitsPoints = unit.points;
            if (unit.superType === 'Unit') 
                unitsPoints = unitTotalPoints(unit as UnitInterf);
            totalPoints += unitsPoints;

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
            const newUsItem = clonePrototype('unit-slot-prototype');
            
            updateSelectableItemPrototype(newUsItem, trait, false, onclick);

            const usName = newUsItem.querySelector('.unit-text') as HTMLElement;
            usName.textContent = trait.name.replace("Battle Traits: ", "");

            const label = newUsItem.querySelector('.ability-label') as HTMLElement;
            label.textContent = 'Battle Traits';

            const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
            usPoints.style.display = 'none';
            usPoints.innerHTML = '';

            removeSection(newUsItem, "unit-details");
            const arrow = newUsItem.querySelector('.arrow') as HTMLElement;
            disableArrow(arrow);
            
            let unitHdr = newUsItem.querySelector(".selectable-item-right") as HTMLElement;
            // does nothing but helps positioning be consistant
            const menu = ContextMenu.create({});
            unitHdr.appendChild(menu);

            const parent = document.getElementById(typename) as HTMLElement;
            parent.appendChild(newUsItem);
            newUsItem.style.display = "";
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
                slot.id = `${lcName}-slot`;

            const unitsPoints = indexedLores[lcName].points;
            if (unitsPoints) {
                totalPoints += unitsPoints;
                refreshPointsOverlay(roster);
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
            const newUsItem = clonePrototype('unit-slot-prototype') as HTMLElement;
            
            updateSelectableItemPrototype(newUsItem, lore, false, () => {
                displayUpgradeOverlay(roster.lores.manifestation);
            });

            const arrow = newUsItem.querySelector('.arrow');
            if (arrow) {
                const wrapper = arrow.closest('.arrow-wrapper') as HTMLElement;
                wrapper.onclick = (event: Event) => {
                    event.stopPropagation();
                    arrowOnClick(arrow as HTMLElement, newUsItem.querySelector('.unit-details'));
                }
            }
            
            async function displayManifestations() {
                const result = await getManifestationUnits();
                if (!result)
                    return;

                const details = newUsItem.querySelector('.unit-details') as HTMLElement;
                const detailSection = details.querySelector('.section') as HTMLElement;
                detailSection.style.display = 'none';

                const createManifestSlot = async (unit: UnitInterf, onclick: (this: GlobalEventHandlers, ev: MouseEvent) => any) => {
                    const subUsItem = clonePrototype('unit-slot-prototype');
                    
                    updateSelectableItemPrototype(subUsItem, unit, true, onclick);

                    clearDetailsSection(subUsItem);
                    const arrow = subUsItem.querySelector('.arrow') as HTMLElement;
                    disableArrow(arrow);

                    const unitPoints = unitTotalPoints(unit);
                    const usPoints = subUsItem.querySelector('.unit-slot-points') as HTMLElement;
                    displayPoints(usPoints, unitPoints);

                    let unitHdr = subUsItem.querySelector(".selectable-item-right") as HTMLElement;
                    
                    // does nothing but helps positioning be consistant
                    const menu = ContextMenu.create({});
                    unitHdr.appendChild(menu);

                    unitHdr = subUsItem.querySelector(".unit-slot-selectable-item-wrapper") as HTMLElement;
                    unitHdr.onclick = onclick;
                    details.appendChild(subUsItem);
                    subUsItem.style.display = "";
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

            
            const usName = newUsItem.querySelector('.unit-text') as HTMLElement;
            // Find the crown icon
            usName.textContent = lore.name;

            // these are all for units
            clearDetailsSection(newUsItem);

            const unitPoints = lore.points;
            const usPoints = newUsItem.querySelector('.unit-slot-points') as HTMLElement;
            displayPoints(usPoints, unitPoints, 'PTS');
            totalPoints += unitPoints;
            refreshPointsOverlay(roster);

            const callbackMap = {
                Delete: async () => {
                    if (roster.lores.manifestation) {
                        removeObjectPoints(roster.lores.manifestation);
                        roster.lores.manifestation = null;
                        putRoster(roster);
                        parent.removeChild(newUsItem);
                    }
                }
            };
            
            //const regItemMenu = ContextMenu.create(callbackMap);
          //  const regHdr = newRegItem.querySelector(".regiment-header");
            //regHdr.appendChild(regItemMenu);

            const menu = ContextMenu.create(callbackMap);
            let unitHdr = newUsItem.querySelector(".selectable-item-right") as HTMLElement;
            unitHdr.appendChild(menu);

            parent.appendChild(newUsItem);
            newUsItem.style.display = "";

            displayManifestations();
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

                const newItem = await createUnitSlot(parent, tactic, i, callbackMap, onclick, false);
                if (newItem) {
                    const label = newItem.querySelector('.ability-label') as HTMLElement;
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

            totalPoints = 0;

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