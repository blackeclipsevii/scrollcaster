import RosterInterf from "../../shared-lib/RosterInterface.js";
import UnitInterf, { UnitType } from "../../shared-lib/UnitInterface.js";
import { getVar } from "../../lib/functions/getVar.js";
import { displayPoints } from "../../lib/host.js";
import { putRoster } from "../../lib/RestAPI/roster.js";
import { unitsApi } from "../../lib/RestAPI/units.js";
import { displayPointsOverlay, hidePointsOverlay, refreshPointsOverlay, updateValidationDisplay } from "../../lib/widgets/displayPointsOverlay.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { initializeFavoritesList, newFavoritesCheckbox, newFavoritesOnChange } from "../../lib/widgets/favorites.js";
import { disableHeaderContextMenu, getPageRouter, goBack, setHeaderTitle } from "../../lib/widgets/header.js";
import { makeSelectableItemName, makeSelectableItemType } from "../../lib/widgets/helpers.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { BasicObject } from "../../shared-lib/BasicObject.js";
import { getGlobalCache } from "../../lib/RestAPI/LocalCache.js";

import Settings from "./settings/Settings.js";
import UnitSettings from "./settings/UnitsSettings.js";
import RegimentOfRenownSettings from "./settings/RegimentOfRenownSettings.js";
import WarscrollSettings from "./settings/WarscrollSettings.js";

const getUnitList = (unit: {type: number}) => {
    let unitList = null;
    if (unit.type === UnitType.Hero) {
        unitList = document.getElementById('hero-list');
    } else if (unit.type === UnitType.Infantry) {
        unitList = document.getElementById('infantry-list');
    } else if (unit.type === UnitType.Cavalry) {
        unitList = document.getElementById('cavalry-list');
    } else if (unit.type === UnitType.Beast) {
        unitList = document.getElementById('beast-list');
    } else if (unit.type === UnitType.Monster) {
        unitList = document.getElementById('monster-list');
    } else if (unit.type === UnitType.WarMachine) {
        unitList = document.getElementById('war-machine-list');
    } else if (unit.type === UnitType.Manifestation) {
        unitList = document.getElementById('manifestations-list');
    } else if (unit.type === UnitType.Terrain) {
        unitList = document.getElementById('faction-terrain-list');
    } else {
        unitList = document.getElementById('manifestations-list');
    }
    return unitList;
}

class ArmyUnitCounts {
    counts: {[name:string]: number} = {};
    setCounts(roster: RosterInterf) {
        roster.regiments.forEach(reg =>{
            if (reg.leader)
                this.updateCount(reg.leader);

            reg.units.forEach(unit =>{
                this.updateCount(unit);
            });
        });

        roster.auxiliaryUnits.forEach(unit => {
            this.updateCount(unit);
        });
    }
    updateCount (unit: UnitInterf) {
        let currentCount = this.counts[unit.id]
        if (!currentCount)
            currentCount = 0;
        this.counts[unit.id] = currentCount + 1;
    }
};

const unitPage = {
    settings: new UnitSettings,
    loadPage (settings: Settings) {
        if (!settings)
            settings = new UnitSettings;
        this.settings = settings as UnitSettings;
        const thisPage = this;

        let armyUnitCounts = new ArmyUnitCounts;

        // element for the 1x Unit in Army display
        const _makeQuantityElement = () => {
            const quantityEle = document.createElement('span');
            quantityEle.className = 'selectable-item-quantity ability-label'
            //quantityEle.style.fontSize = '10px';
            //quantityEle.className = 'ability-label';
            return quantityEle;
        }

        // Update the quantity element
        const _updateCountDisplay = (identifiableObj: {id: string}, labelItem:HTMLElement, selectableItem:HTMLElement, quantityEle:HTMLElement, message: string) => {
            const count = armyUnitCounts.counts[identifiableObj.id];
            if (count) {
                quantityEle.textContent = `${armyUnitCounts.counts[identifiableObj.id]}x ${message}`;
                quantityEle.style.display = '';
                selectableItem.classList.remove('not-added');
                selectableItem.classList.add('added');
                labelItem.style.color = '';
                labelItem.style.backgroundColor = '';
            } else {
                quantityEle.textContent = 'None';
                quantityEle.style.display = 'none';
                selectableItem.classList.add('not-added');
                selectableItem.classList.remove('added');
                labelItem.style.color = getVar('white-3');
                labelItem.style.backgroundColor = getVar('black-2');
            }
        }

        const _makeSelectableItem = (displayableObj: BasicObject, 
                                     unitList: HTMLElement, 
                                     itemOnClick: (this: HTMLDivElement, ev: MouseEvent) => any, 
                                     addOnClick: ((event:Event) => void) | null=null, 
                                     countMessage: string | null = null) => {
            const section = unitList.closest('.section') as null | HTMLElement;
            if (!section)
                return null;
            section.style.display = '';

            const item = document.createElement('div');
            item.classList.add('selectable-item');
            item.addEventListener('click', itemOnClick);

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');

            const nameEle = makeSelectableItemName(displayableObj);
            left.appendChild(nameEle);

            const roleEle = makeSelectableItemType(displayableObj);
            left.appendChild(roleEle);

            let quantityEle = null;
            if (addOnClick && countMessage) {
                quantityEle = _makeQuantityElement();
                left.appendChild(quantityEle);
                _updateCountDisplay(displayableObj, roleEle, item, quantityEle, countMessage);
            }
            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            const points = document.createElement('span');
            points.className = 'points-label';
            displayPoints(points, displayableObj.points);

            const onchange = newFavoritesOnChange(unitList, item, displayableObj.name);
            const typeStr = `${displayableObj.type}`;
            const heart = newFavoritesCheckbox(displayableObj.id, typeStr, onchange);

            right.append(heart, points);
            if (addOnClick) {
                const addBtn = document.createElement('div');
                addBtn.classList.add('rectangle-button');
                addBtn.innerHTML = `
                    <div class='plus-wrapper'>
                        <img class='navigation-img add-unit-icon' src='../resources/${getVar('plus-icon')}'></img>
                    </div>
                `;
                addBtn.addEventListener('click', async (event) => {
                    await addOnClick(event);
                    if (quantityEle)
                        _updateCountDisplay(displayableObj, roleEle, item, quantityEle, countMessage!!);
                });
                right.append(addBtn);
            }
            
            item.append(left, right);
            unitList.appendChild(item);
            
            if (heart.checked)
                onchange(true, displayableObj.id, typeStr);

            return item;
        };


        const loadUnitsForCatalog = async () => {
            hidePointsOverlay();
            const units = await getGlobalCache()?.getUnits(this.settings.armyName);
            if (!units)
                return null;

            const unitsValues = Object.values(units);
            unitsValues.forEach(unit => {
                const unitList = getUnitList(unit);
                if (!unitList)
                    return;

                const displayOnClick = () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    getPageRouter()?.goTo(settings);
                };
                const selectable = _makeSelectableItem(unit, unitList, displayOnClick);
            });
        }

        async function loadUnits() {
            if (thisPage.settings.roster) {
                thisPage.settings.armyName = thisPage.settings.roster.army;
                armyUnitCounts.setCounts(thisPage.settings.roster);
            }
            
            const roster = thisPage.settings.roster as RosterInterf;

            displayPointsOverlay(roster);
            let isNewRegiment = false;
            let isSelectingLeader = false;
            if (thisPage.settings.hasRegimentIndex()) {
                const reg = roster.regiments[thisPage.settings.regimentIndex!!];
                isSelectingLeader = reg.leader === null;
                isNewRegiment = isSelectingLeader && reg.units.length === 0;
            }

            const loadRor = async () => {
                const units = await getGlobalCache()?.getRegimentsOfRenown(roster.army);
                if (!units)
                    return;
                
                units.forEach(regimentOfRenown => {
                    const unitList = document.getElementById('regiments-of-renown-list');
                    if (!unitList)
                        return;

                    const countMessage = 'Regiment in Army';

                    const displayInfoOnClick = () => {
                        const settings = new RegimentOfRenownSettings;
                        settings.ror = regimentOfRenown;
                        getPageRouter()?.goTo(settings);
                    }

                    const addButtonOnClick = async (event: Event) => {
                        event.stopPropagation(); // Prevents click from triggering page change
                        if (isNewRegiment) {
                            // we were making a new regiment but chose a ror
                            roster.regiments.splice(thisPage.settings.regimentIndex!!, 1);
                        }
                        roster.regimentOfRenown = regimentOfRenown;
                        await putRoster(roster);
                        goBack();
                    }

                    const seletableItem = _makeSelectableItem(
                        regimentOfRenown,
                        unitList, 
                        displayInfoOnClick, 
                        addButtonOnClick, 
                        countMessage);
                });
            }

            let leaderId = null;
            if (thisPage.settings.hasRegimentIndex()){
                const regiment = roster.regiments[thisPage.settings.regimentIndex!!];
                if (regiment.leader)
                    leaderId = regiment.leader.id;
            }
            const units = await unitsApi.get(roster.army, leaderId);
            if (!units) {
                return;
            }
            const availableUnits = Object.values(units);
            availableUnits.forEach(unit => {
                if (unit._tags.length > 0) {
                   // console.log (`${unit.name} has tags: ${unit._tags.join(', ')}`);
                }
                if (!thisPage.settings.displayLegends && unit.keywords.includes('Legends'))
                    return;

                if (thisPage.settings.type && !unit.keywords.includes(thisPage.settings.type.toUpperCase()))
                    return;

                if (thisPage.settings.type === null && unit.type > 5)
                    return;

                if (isSelectingLeader) {
                    // cant lead without a profile
                    if (!unit.battleProfile)
                        return;

                    // the profile explicitly says they cannot lead
                    if (unit.battleProfile.regimentOptions.toUpperCase() === 'NONE')
                        return;
                }

                const unitList = getUnitList(unit);
                if (!unitList)
                    return;

                const countMessage = 'Unit in army';
                const displayInfoOnClick = () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    getPageRouter()?.goTo(settings);
                };
                const addButtonOnClick = async (event: Event) => {
                    event.stopPropagation(); // Prevents click from triggering page change

                    const makeCopy = (originalUnit: UnitInterf) => {
                        return JSON.parse(JSON.stringify(originalUnit)) as UnitInterf;
                    }

                    const clone = makeCopy(unit);

                    if (thisPage.settings.auxiliary) {
                        roster.auxiliaryUnits.push(clone);
                    } else if (unit.type === UnitType.Terrain) {
                        roster.terrainFeature = clone;
                    } else {
                        const regiment = roster.regiments[thisPage.settings.regimentIndex!!];
                        if (isSelectingLeader) {
                            regiment.leader = clone;
                        } else {
                            regiment.units.push(clone);
                        }
                    }

                    await putRoster(roster);
                    if (isSelectingLeader || unit.type === UnitType.Terrain) {
                        goBack();
                    } else {
                        armyUnitCounts.updateCount(unit);
                        refreshPointsOverlay(roster);
                        updateValidationDisplay(roster);
                    }
                };
                const seletableItem = _makeSelectableItem(
                    unit,
                    unitList,
                    displayInfoOnClick,
                    addButtonOnClick,
                    countMessage);
            });

            if (isNewRegiment && !roster.regimentOfRenown) {
                // we could make the regiment a ror
                await loadRor();
            }
        }

        const _makeUnitLayout = () => {
            const sections = [
                'Hero', 
                'Infantry', 
                'Cavalry', 
                'Beast', 
                'Monster', 
                'War Machine', 
                'Manifestations', 
                'Faction Terrain', 
                'Regiments of Renown'
            ];
            makeLayout(sections);
        }
        setHeaderTitle('Units');
        disableHeaderContextMenu();
        initializeFavoritesList();
        _makeUnitLayout();
        
        if (thisPage.settings.roster) {
            refreshPointsOverlay(thisPage.settings.roster);
            loadUnits();
        } else {
            loadUnitsForCatalog();
        }
        swapLayout();
        if (thisPage.settings.roster) {
            // leave room for the overlay
            const ele = document.querySelector('.main');
            if (ele)
                ele.classList.add('main-extended');
        }
        initializeDraggable('units');
    }
}

export const registerUnitsPage = () => {
    getPageRouter()?.registerPage('units', unitPage);
}