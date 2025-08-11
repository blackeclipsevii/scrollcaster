import { Force } from "../../shared-lib/Force.js";
import RosterInterf from "../../shared-lib/RosterInterface.js";
import UnitInterf from "../../shared-lib/UnitInterface.js";
import UpgradeInterf from "../../shared-lib/UpgradeInterface.js";
import { endpoint } from "../../lib/endpoint.js";
import { getVar } from "../../lib/functions/getVar.js";
import { displayPoints, dynamicPages } from "../../lib/host.js";
import { fetchWithLoadingDisplay } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";
import { putRoster } from "../../lib/RestAPI/roster.js";
import { unitsApi } from "../../lib/RestAPI/units.js";
import { displayPointsOverlay, hidePointsOverlay, refreshPointsOverlay, updateValidationDisplay } from "../../lib/widgets/displayPointsOverlay.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { initializeFavoritesList, newFavoritesCheckbox, newFavoritesOnChange } from "../../lib/widgets/favorites.js";
import { disableHeaderContextMenu, dynamicGoTo, goBack, setHeaderTitle, Settings } from "../../lib/widgets/header.js";
import { makeSelectableItemName, makeSelectableItemType } from "../../lib/widgets/helpers.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { RegimentOfRenownSettings } from "./regimentOfRenown.js";
import { WarscrollSettings } from "./warscroll.js";
import { BasicObject } from "../../shared-lib/BasicObject.js";

export class UnitSettings implements Settings {
    [name: string]: unknown;
    type = null as string | null;
    roster = null as  RosterInterf | null;
    regimentIndex = null as number | null;
    auxiliary = false;

    displayLegends = false;
    armyName = null as string | null;

    hasRegimentIndex() {
        return this.regimentIndex !== null;
    }
}

const getUnitList = (unit: {type: number}) => {
    let unitList = null;
    if (unit.type === 0) {
        unitList = document.getElementById('hero-list');
    } else if (unit.type == 1) {
        unitList = document.getElementById('infantry-list');
    } else if (unit.type == 2) {
        unitList = document.getElementById('cavalry-list');
    } else if (unit.type == 3) {
        unitList = document.getElementById('beast-list');
    } else if (unit.type == 4) {
        unitList = document.getElementById('monster-list');
    } else if (unit.type == 5) {
        unitList = document.getElementById('war-machine-list');
    } else if (unit.type == 6) {
        unitList = document.getElementById('manifestations-list');
    } else if (unit.type == 7) {
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
    _cache: {
        regimentsOfRenown: {
            units: null as Force[] | null,
            armyName: null as string | null
        }
    },
    async fetchRor() {
        if (this._cache.regimentsOfRenown.units && this._cache.regimentsOfRenown.armyName === this.settings.armyName) {
            return this._cache.regimentsOfRenown.units;
        }
        const url = `${endpoint}/regimentsOfRenown?army=${this.settings.armyName}`;
        const response = await fetchWithLoadingDisplay(encodeURI(url)) as Force[] | null;
        if (response) {
            this._cache.regimentsOfRenown.units = response;
            this._cache.regimentsOfRenown.armyName = this.settings.armyName;
        }
        return response;
    },
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

            section.style.display = 'block';

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
                const addBtn = document.createElement('button');
                addBtn.classList.add('rectangle-button');
                addBtn.textContent = '+';
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
            const units = await unitsApi.get(this.settings.armyName);
            if (!units)
                return null;

            let unitIds = Object.getOwnPropertyNames(units);
            unitIds.forEach(id => {
                const unit = units[id];
                const unitList = getUnitList(unit);
                if (!unitList)
                    return;

                const displayOnClick = () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
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

            displayPointsOverlay();
            refreshPointsOverlay(roster);
            updateValidationDisplay(roster);

            let isNewRegiment = false;
            let isSelectingLeader = false;
            if (thisPage.settings.hasRegimentIndex()) {
                const reg = roster.regiments[thisPage.settings.regimentIndex!!];
                isSelectingLeader = reg.leader === null;
                isNewRegiment = isSelectingLeader && reg.units.length === 0;
            }

            const loadRor = async () => {
                const units = await thisPage.fetchRor();
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
                        dynamicGoTo(settings);
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

            if (isNewRegiment && !roster.regimentOfRenown) {
                // we could make the regiment a ror
                await loadRor();
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
                    dynamicGoTo(settings);
                };
                const addButtonOnClick = async (event: Event) => {
                    event.stopPropagation(); // Prevents click from triggering page change

                    const makeCopy = (originalUnit: UnitInterf) => {
                        return JSON.parse(JSON.stringify(originalUnit)) as UnitInterf;
                    }

                    const clone = makeCopy(unit);

                    if (thisPage.settings.auxiliary) {
                        roster.auxiliaryUnits.push(clone);
                    } else if (unit.type == 7) {
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
                    if (isSelectingLeader || unit.type == 7) {
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
        initializeDraggable('units');
    }
}

dynamicPages['units'] = unitPage;