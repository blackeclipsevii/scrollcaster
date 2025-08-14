import { EnhancementGroup } from "../../../shared-lib/ArmyUpgrades.js";
import { Costed, BasicObject, Identifiable, Typed } from "../../../shared-lib/BasicObject.js";
import OptionSet from "../../../shared-lib/Options.js";
import RosterInterf, { RegimentInterf } from "../../../shared-lib/RosterInterface.js";
import UnitInterf, { EnhancementSlotInterf } from "../../../shared-lib/UnitInterface.js";
import { getVar } from "../../functions/getVar.js";
import { displayPoints, unitTotalPoints } from "../../host.js";
import { putRoster } from "../../RestAPI/roster.js";
import { CallbackMap, ContextMenu } from "../contextMenu.js";
import { refreshPointsOverlay, updateValidationDisplay } from "../displayPointsOverlay.js";
import { displayUpgradeOverlay } from "../displayUpgradeOverlay.js";
import { displayWeaponOverlay } from "../displayWeaponOverlay.js";
import { makeSelectableItemName, makeSelectableItemType } from "../helpers.js";

export const toggleUnitAddButton = (regItem: HTMLElement, _regiment: RegimentInterf) => {
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

export interface GenericSlot {
    setOnClick(slotOnClick: (this: HTMLElement, ev: MouseEvent) => any): void;
    getDetails(): HTMLDivElement;
    displayPoints(unit: BasicObject): void;
    initializeContextMenu(callbackMap: CallbackMap): void;
    attachAndDisplay(): void;
    enableDrawer(): void;
    disableDrawer(): void;
    getHTMLElement(): HTMLDivElement;
}

export default class UnitSlot implements GenericSlot {
    _unitSlot: HTMLDivElement;
    _parent: HTMLElement;
    pointSet: boolean;

    constructor(parent: HTMLElement, slottedObject: Identifiable & Typed) {
        this.pointSet = false;
        this._unitSlot = document.createElement('div');
        this._unitSlot.innerHTML = `
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
        `
        this._unitSlot.className = `unit-slot`;
        this._unitSlot.style.padding = "0.4em";
        this._unitSlot.style.marginBottom = "0.3rem";
        this._unitSlot.style.borderRadius = "4px";

        const nameEle = makeSelectableItemName(slottedObject);
        nameEle.classList.add('unit-text');

        const left = this._unitSlot.querySelector('.selectable-item-left') as HTMLElement;
        left.appendChild(nameEle);

        const roleEle = makeSelectableItemType(slottedObject);

        left.insertBefore(roleEle, left.firstChild);
        left.insertBefore(nameEle, left.firstChild);

        this._parent = parent;
    }

    getHTMLElement(): HTMLDivElement {
        return this._unitSlot;
    }

    setOnClick(slotOnClick: (this: HTMLElement, ev: MouseEvent) => any) {
        const selectableItem = this._unitSlot.querySelector('.unit-slot-selectable-item-wrapper') as HTMLElement;
        selectableItem.addEventListener('click', slotOnClick);
    }

    _addDetails() {
        const details = document.createElement('div');
        details.innerHTML = `
            <div style='display: none' class="section upgrade-section">
                <label style='display: none' class="upgrade-label is-general">
                    <input type="checkbox" class="upgrade-checkbox general-checkbox"> General
                </label>
                
                <label style='display: none' class="upgrade-label is-reinforced">
                    <input type="checkbox" class="upgrade-checkbox reinforced-checkbox"> Reinforced
                </label>
            </div>
        `
        details.className = 'unit-details';
        this._unitSlot.appendChild(details);
        return details;
    }

    // Get the regiment using the embedded regiment index
    _getRegimentByDiv = (element: HTMLElement, roster: RosterInterf): RegimentInterf | null => {
        let div = element.closest(".regiment-item");
        if (div) {
            div = div.querySelector(".regiment-idx") as HTMLElement;
            const regIdx = Number(div.textContent);
            return roster.regiments[regIdx];
        }
        return null;
    }

    // Get the unit using the embedded unit index
    _getUnitByDiv = (roster: RosterInterf, regiment?: RegimentInterf | null): UnitInterf | null => {
        const div = this._unitSlot.querySelector(".unit-idx");
        if (!div)
            return null;

        const unitIdx = Number(div.textContent);
        if (regiment) {
            return unitIdx === -1 ? regiment.leader : regiment.units[unitIdx];
        }
        return roster.auxiliaryUnits[unitIdx];
    }


    getDetails(): HTMLDivElement {
        const details = this._unitSlot.querySelector('.unit-details');
        if (!details) {
            return this._addDetails();
        }
        return details as HTMLDivElement;
    }

    _getUpgradeSection(): HTMLDivElement {
        const details = this.getDetails();
        const section = details.querySelector('.upgrade-section') as HTMLDivElement;
        section.style.display = '';
        return section;
    }

    // Add the general label checkbox for this unit slot
    addGeneralLabel(roster: RosterInterf, unit: UnitInterf) {
        const upgrades = this._getUpgradeSection();
        upgrades.style.display = '';
        const checkbox = upgrades.querySelector('.general-checkbox') as HTMLInputElement;

        if (unit.isGeneral) {
            const icon = this._unitSlot.querySelector('.general-label') as HTMLElement;
            checkbox.checked = unit.isGeneral;
            icon.style.display = 'inline';
        }

        const isGeneral = upgrades.querySelector('.is-general') as HTMLInputElement;
        isGeneral.style.display = '';

        checkbox.onchange = () => {
            const generalLabel = this._unitSlot.querySelector('.general-label') as HTMLElement;
            generalLabel.style.display = checkbox.checked ? 'inline' : 'none';

            const regiment = this._getRegimentByDiv(checkbox,  roster);
            const unit = this._getUnitByDiv(roster, regiment);

            unit!!.isGeneral = checkbox.checked;
            putRoster(roster);
            updateValidationDisplay(roster);

            if (regiment) {
                const regItem = this._parent.closest('.regiment-item') as HTMLElement;
                toggleUnitAddButton(regItem, regiment);
            }
        };
    }

    // add the reinforced label checkbox for this unit slot
    addReinforcedLabel(roster: RosterInterf, unit: UnitInterf) {
        const upgrades = this._getUpgradeSection();
        upgrades.style.display = '';

        const checkbox = upgrades.querySelector('.reinforced-checkbox') as HTMLInputElement;
        if (unit.isReinforced) {
            const icon = this._unitSlot.querySelector('.reinforced-label') as HTMLElement;
            checkbox.checked = true;
            icon.style.display = 'inline';
        }

        const isReinforced = upgrades.querySelector('.is-reinforced') as HTMLInputElement;
        isReinforced.style.display = '';

        checkbox.onchange = () => {
            const reinLabel = this._unitSlot.querySelector('.reinforced-label') as HTMLElement;
            reinLabel.style.display = checkbox.checked ? 'inline' : 'none';

            const regiment = this._getRegimentByDiv(checkbox,  roster);
            const unit = this._getUnitByDiv(roster, regiment)
            if (unit) {
                unit.isReinforced = checkbox.checked;
                putRoster(roster);

                const usPoints = this._unitSlot.querySelector('.unit-slot-points') as HTMLElement;
                const points = unitTotalPoints(unit);
                usPoints.textContent = `${points.toString()} PTS`;
                refreshPointsOverlay(roster);
                updateValidationDisplay(roster);
            }
        };
    }

    _addEnhancementUpgradeSection(enhancement: EnhancementSlotInterf) {
        const div = document.createElement('div');
        div.classList.add('section');
        div.classList.add('upgrade-section');
        
        const h3 = document.createElement('h3');
        h3.className = 'section-title';
        h3.textContent = `${enhancement.name}:`;
        div.appendChild(h3);

        const details = this.getDetails();
        details.appendChild(div);
        return div;
    }

    makeUpgradeGroup = (obj: {name: string, points: number}) => {
        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'upgrade-group';
        upgradeDiv.innerHTML = `
        <div class='upgrade-group-left'>
            <label class="upgrade-label">
                <input type="checkbox" class="upgrade-checkbox">${obj.name}
            </label>
        </div>
        <div class='upgrade-group-right'>
            <div style='display: inline-block' class='upgrade-points points-label'>${obj.points} PTS</div>
            <div class="upgrade-button">
                <div class='tiny-magnifier-wrapper'>
                    <img class='tiny-magnifier invert-img' src='../../resources/${getVar('search-icon')}'></img>
                </div>
            </div>
        </div>`;
    
        if (obj.points === 0) {
            const pl = upgradeDiv.querySelector('.points-label') as HTMLElement;
            pl.style.display = 'none';
            const groupLeft = upgradeDiv.querySelector('.upgrade-group-left') as HTMLDivElement;
            groupLeft.style.maxWidth = '85%';
        }

        return upgradeDiv;
    }

    async displayEnhancements(roster: RosterInterf, unit: UnitInterf, type: string, enhancementGroup: EnhancementGroup) {
        const details =  this._addEnhancementUpgradeSection(unit.enhancements[type]);

        const values = Object.values(enhancementGroup.upgrades);
        values.forEach(upgrade => {
            const upgradeDiv = this.makeUpgradeGroup(upgrade);

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
                        if (upgrade.points > 0) {
                            const unitPoints = unitTotalPoints(unit);
                            const usPoints = this._unitSlot.querySelector('.unit-slot-points') as HTMLElement;
                            displayPoints(usPoints, unitPoints, 'PTS');
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
                        if (upgrade.points > 0) {
                            const unitPoints = unitTotalPoints(unit);
                            const usPoints = this._unitSlot.querySelector('.unit-slot-points') as HTMLElement;
                            displayPoints(usPoints, unitPoints, 'PTS');
                            refreshPointsOverlay(roster);
                        }
                        updateValidationDisplay(roster);
                        putRoster(roster);
                    }
                }
            };
            details.appendChild(upgradeDiv);
        });
    }

    displayWarscrollOption(roster: RosterInterf, unit: UnitInterf, optionSet: OptionSet) {
        const details = this.getDetails();
        const warOptDiv = document.createElement('div');
        warOptDiv.className = 'section upgrade-section';
        warOptDiv.innerHTML = `
            <h3 class="section-title">${optionSet.name}:</h3>
        `;
        const options = Object.values(optionSet.options);
        options.forEach(option => {
            const upgradeDiv = this.makeUpgradeGroup(option);

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
                if (option.points > 0) {
                    const unitPoints = unitTotalPoints(unit);
                    const usPoints = this._unitSlot.querySelector('.unit-slot-points') as HTMLElement;
                    displayPoints(usPoints, unitPoints, 'PTS');
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

    displayPoints(unit: BasicObject) {
        let unitPoints = 0;
        if (unit.superType === 'Unit')
            unitPoints = unitTotalPoints(unit as UnitInterf);
        else if (unit.superType !== 'Other')
            unitPoints = (unit as Costed).points;

        const usPoints = this._unitSlot.querySelector('.unit-slot-points') as HTMLElement;
        this.pointSet = true;
        displayPoints(usPoints, unitPoints, 'PTS');
    }
    
    getUnitIndex() {
        const hiddenIdx = this._unitSlot.querySelector('.unit-idx') as HTMLElement;
        return Number(hiddenIdx.textContent);
    }

    setUnitIndex(index: number) {
        const hiddenIdx = this._unitSlot.querySelector('.unit-idx') as HTMLElement;
        hiddenIdx.textContent = `${index}`;
    }

    initializeContextMenu(callbackMap: CallbackMap) {
        const unitHdr = this._unitSlot.querySelector(".selectable-item-right") as HTMLElement | null;
        if (!unitHdr)
            return;

        const menu = ContextMenu.create(callbackMap);
        unitHdr.appendChild(menu);
    }

    attachAndDisplay() {
        if (!this.pointSet) {
            const usPoints = this._unitSlot.querySelector('.unit-slot-points') as HTMLElement;
            usPoints.style.display = 'none';
            usPoints.textContent = '';
        }
        this._parent.appendChild(this._unitSlot);
        this._unitSlot.style.display = "";
    }

    enableDrawer() {
        const arrow = this._unitSlot.querySelector('.arrow') as HTMLElement | null;
        if (arrow) {
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

            const wrapper = arrow.closest('.arrow-wrapper') as HTMLElement;
            wrapper.onclick = (event) => {
                event.stopPropagation();
                arrowOnClick(arrow, this._unitSlot.querySelector('.unit-details'));
            }
        }
    }

    disableDrawer() {
        const arrow = this._unitSlot.querySelector('.arrow');
        if (!arrow)
            return;

        // dot instead of arrow
        const img = arrow.querySelector('img') as HTMLImageElement;
        img.src = `../resources/${getVar('ab-control')}`
        img.style.height = '.5em';
        img.style.width = '.5em';
        img.style.margin = '.75em';

        // no click hint
        const wrapper = arrow.closest('.arrow-wrapper') as HTMLElement;
        wrapper.style.cursor = 'default';
    }
}