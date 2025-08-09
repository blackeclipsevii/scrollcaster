
var totalPoints = 0;

class BuilderSettings {
    rosterId = null;
    roster = null;
};

const builderPage = {
    roster: null,
    settings: null,
    _cache: {
        upgrades: {
            upgrades: null,
            armyName: null
        },
        units: {
            units: null,
            armyName: null,
            leaderId: null
        }
    },
    async fetchUpgrades() {
        if(this._cache.upgrades.upgrades && this._cache.upgrades.armyName === this.roster.army)
            return this._cache.upgrades.upgrades;
        const result = await fetchUpgrades(this.roster.army);
        if (result){
            this._cache.upgrades.upgrades = result;
            this._cache.upgrades.armyName = this.roster.army;
        }
        return result;
    },
    async loadPage(settings) {
        if (!settings) {
            throw 'builder requires settings';
        }
        thisPage = this;
        thisPage.settings = settings;

        // just use the provided roster
        if (settings.roster)
            thisPage.roster = settings.roster;

        // get a roster by the id
        const rosterId = thisPage.settings.rosterId;
        if (!thisPage.roster) {
             thisPage.roster = await getRoster(rosterId);
        }

        if (thisPage.settings.rosterId && thisPage.roster.id !== thisPage.settings.rosterId) {
            thisPage.roster = await getRoster(rosterId);
        }

        // to-do remove
        roster = thisPage.roster;

        // Update the points display before removing a pointed object (obj.points)
        const removeObjectPoints = (pointedObj) => {
            totalPoints -= pointedObj.points;
            refreshPointsOverlay(thisPage.roster.id);
            updateValidationDisplay();
        }

        const disableArrow = (arrow) => {
            const img = arrow.querySelector('img');
            img.src = `../resources/${getVar('ab-control')}`
            img.style.height = '.5em';
            img.style.width = '.5em';
            img.style.margin = '.75em';
            arrow.closest('.arrow-wrapper').style.cursor = 'default';
        }

        const clearDetailsSection = (item) => {
            removeSection(item, 'is-general');
            removeSection(item, 'is-reinforced');
        }

        const toggleUnitAddButton = (regItem, _regiment) => {
            const btn = regItem.querySelector('.add-unit-button');
            let maxUnits = 3;
            if ( _regiment.leader && _regiment.leader.isGeneral)
                maxUnits = 4;
            btn.disabled = (_regiment.units.length >= maxUnits) && _regiment.leader;

            if (!_regiment.leader) {
                btn.textContent = 'Add Leader +';
                const leaderBtnColor = getVar('red-color');
                btn.style.borderColor = leaderBtnColor;
                btn.style.color = leaderBtnColor;
            }
        }

        function _addEnhancementUpgradeSection(newUsItem, enhancement) {
            const div = document.createElement('div');
            div.classList.add('section');
            div.classList.add('upgrade-section');
            
            const h3 = document.createElement('h3');
            h3.className = 'section-title';
            h3.textContent = `${enhancement.name}:`;
            div.appendChild(h3);

            const details = newUsItem.querySelector('.unit-details');
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
            const btn = div.querySelector(`button`);
            btn.onclick = () => {
                const parent = div;
                const idx = Number(parent.id.substring(parent.id.length-1)) - 1;
                const content = parent.querySelector('.regiment-content');
                const count = content.children.length;

                const settings = new UnitSettings;
                settings.roster = thisPage.roster;
                settings.regimentIndex = idx;
                if (count === 0)
                    settings.type = 'hero';

                dynamicGoTo(settings);
            };
            return div;
        }

        function updateSelectableItemPrototype(prototype, displayableObj, isUnit, leftOnClick) {
            const selectableItem = prototype.querySelector('.unit-slot-selectable-item-wrapper');
            selectableItem.addEventListener('click', leftOnClick);

            const nameEle = makeSelectableItemName(displayableObj);
            nameEle.classList.add('unit-text');

            const left = prototype.querySelector('.selectable-item-left');
            left.appendChild(nameEle);

            const roleEle = makeSelectableItemType(displayableObj, isUnit);

            left.insertBefore(roleEle, left.firstChild);
            left.insertBefore(nameEle, left.firstChild);
        }

        function clonePrototype(id, newId = '') {
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

        const arrowOnClick = (arrow, details) => {
            if(!details)
                return;
            
            if (details.style.maxHeight) {
                details.style.maxHeight = null;
                arrow.style.transform = 'rotate(0deg)';
            } else {
                details.style.maxHeight = details.scrollHeight + "px";
                arrow.style.transform = 'rotate(90deg)';
            }
        }

        async function displayWarscrollOption(unit, optionSet, newUsItem) {
            const details = newUsItem.querySelector('.unit-details');
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
                    const pl = upgradeDiv.querySelector('.points-label');
                    pl.style.display = 'none';
                }

                const label = upgradeDiv.querySelector(`.upgrade-button`);
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

                const checkbox = upgradeDiv.querySelector(`.upgrade-checkbox`);
                if (optionSet.selection && optionSet.selection.name === option.name) {
                    checkbox.checked = true;
                }

                const handlechange = (points, subtract=false) => {
                    if (costsPoints) {
                        const unitPoints = unitTotalPoints(unit);
                        const usPoints = newUsItem.querySelector('.unit-slot-points');
                        displayPoints(usPoints, unitPoints, 'PTS');
                        if (subtract)
                            totalPoints -= points;
                        else
                            totalPoints += points;
                        refreshPointsOverlay(thisPage.roster.id);
                    }
                    updateValidationDisplay();
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

        async function displayEnhancements(unit, newUsItem, type) {
            const details =  _addEnhancementUpgradeSection(newUsItem, unit.enhancements[type]);
            const allUpgrades = await thisPage.fetchUpgrades();
            const enhancementGroup = allUpgrades.enhancements[type];
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
                    const pl = upgradeDiv.querySelector('.points-label');
                    pl.style.display = 'none';
                }

                const label = upgradeDiv.querySelector(`.upgrade-button`);
                label.onclick = () => {
                    displayUpgradeOverlay(upgrade);
                };

                const checkbox = upgradeDiv.querySelector(`.upgrade-checkbox`);
                if (unit.enhancements[type].slot && unit.enhancements[type].slot.id === upgrade.id) {
                    checkbox.checked = true;
                }

                checkbox.onchange = () => {
                    if (checkbox.checked) {
                        if (!unit.enhancements[type].slot) {
                            unit.enhancements[type].slot = upgrade;
                            if (costsPoints) {
                                const unitPoints = unitTotalPoints(unit);
                                const usPoints = newUsItem.querySelector('.unit-slot-points');
                                displayPoints(usPoints, unitPoints, 'PTS');
                                totalPoints += upgrade.points;
                                refreshPointsOverlay(thisPage.roster.id);
                            }
                            updateValidationDisplay();
                            putRoster(roster);
                        } else if (unit.enhancements[type].slot.id !== upgrade.id) {
                            checkbox.checked = false;
                        }
                    } else {
                        if (unit.enhancements[type].slot && unit.enhancements[type].slot.id === upgrade.id) {
                            unit.enhancements[type].slot = null;
                            if (costsPoints) {
                                const unitPoints = unitTotalPoints(unit);
                                const usPoints = newUsItem.querySelector('.unit-slot-points');
                                displayPoints(usPoints, unitPoints, 'PTS');
                                removeObjectPoints(upgrade);
                            }
                            updateValidationDisplay();
                            putRoster(roster);
                        }
                    }
                };
                details.appendChild(upgradeDiv);
            });
        }

        const exportListAndDisplay = Overlay.toggleFactory('block', async () =>{
            const text = await exportRoster(roster);
            const modal = document.querySelector(".modal");

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

        function removeSection(section, className) {
            const child = section.querySelector(`.${className}`);
            if (child) {
                child.parentElement.removeChild(child);
            } else {
                console.log (`failed to remove ${className}`)
            }
        }

        async function createUnitSlot(parent, unit, idx, callbackMap, onclick, isUnit){
            if (!unit)
                return;
            const newUsItem = clonePrototype('unit-slot-prototype');
            
            const hiddenIdx = newUsItem.querySelector('.unit-idx');
            hiddenIdx.textContent = idx;

            let numOptions = 0;
            const canBeGeneral = !(unit.type !== 0 || !parent.className.includes('regiment'));
            if (unit.type !== 0 || !parent.className.includes('regiment')) {
                removeSection(newUsItem, 'is-general');
            } else {
                ++ numOptions;
                const checkbox = newUsItem.querySelector('.general-checkbox');
                checkbox.onchange = () => {
                    const unitContainer = checkbox.closest('.unit-slot');
                    const crown = unitContainer.querySelector('.general-label');

                    crown.style.display = checkbox.checked ? 'inline' : 'none';

                    let regiment = null;
                    let div = checkbox.closest(".regiment-item");
                    if (div) {
                        div = div.querySelector(".regiment-idx");
                        const regIdx = Number(div.textContent);
                        regiment = thisPage.roster.regiments[regIdx];
                    }

                    let unit = null;
                    div = checkbox.closest(".unit-slot");
                    div = div.querySelector(".unit-idx");
                    const unitIdx = Number(div.textContent);
                    if (regiment) {
                        unit = unitIdx === -1 ? regiment.leader : regiment.units[unitIdx];
                    } else {
                        unit = thisPage.roster.auxiliaryUnits[unitIdx];
                    }

                    unit.isGeneral = checkbox.checked;
                    putRoster(roster);
                    updateValidationDisplay();

                    if (regiment) {
                        const regItem = parent.closest('.regiment-item');
                        toggleUnitAddButton(regItem, regiment);
                    }
                };
            }

            if (!unit.canBeReinforced) {
                if (!canBeGeneral) {
                    const child = newUsItem.querySelector(`.is-reinforced`);
                    const parentSection = child.closest('.section');
                    parentSection.style.display = 'none';
                }
                {
                    removeSection(newUsItem, 'is-reinforced');
                }
            } else {
                ++ numOptions;
                const checkbox = newUsItem.querySelector('.reinforced-checkbox');
                checkbox.onchange = () => {
                    const unitContainer = checkbox.closest('.unit-slot');
                    const crown = unitContainer.querySelector('.reinforced-label');

                    crown.style.display = checkbox.checked ? 'inline' : 'none';

                    let regiment = null;
                    let div = checkbox.closest(".regiment-item");
                    if (div) {
                        div = div.querySelector(".regiment-idx");
                        const regIdx = Number(div.textContent);
                        regiment = thisPage.roster.regiments[regIdx];
                    }

                    let unit = null;
                    div = checkbox.closest(".unit-slot");
                    div = div.querySelector(".unit-idx");
                    const unitIdx = Number(div.textContent);
                    if (regiment) {
                        unit = unitIdx === -1 ? regiment.leader : regiment.units[unitIdx];
                    } else {
                        unit = thisPage.roster.auxiliaryUnits[unitIdx];
                    }

                    const ptsBefore = unitTotalPoints(unit);
                    unit.isReinforced = checkbox.checked;
                    const ptsAfter = unitTotalPoints(unit);
                    putRoster(roster);

                    const usPoints = unitContainer.querySelector('.unit-slot-points');
                    usPoints.textContent = `${ptsAfter} PTS`;
                    totalPoints = totalPoints - (ptsBefore - ptsAfter);
                    refreshPointsOverlay(thisPage.roster.id);
                    updateValidationDisplay();
                };
            }

            if (unit.enhancements) {
                const enhancementNames = Object.getOwnPropertyNames(unit.enhancements);
                if (enhancementNames.length > 1)
                    enhancementNames.sort((a,b) => a.localeCompare(b));
                for (let e = 0; e < enhancementNames.length; ++e) {
                    ++ numOptions;
                    await displayEnhancements(unit, newUsItem, enhancementNames[e]);
                }
            }

            if (unit.optionSets) {
                unit.optionSets.forEach(optionSet => {
                    ++numOptions;
                    displayWarscrollOption(unit, optionSet, newUsItem);
                });
            }
            
            // to-do display as part of the model
            if (unit.models) {
                unit.models.forEach(model => {
                    model.optionSets.forEach(optionSet => {
                        ++numOptions;
                        displayWarscrollOption(unit, optionSet, newUsItem);
                    });
                });
            }

            if (numOptions < 1) {
                // remove drawer
                removeSection(newUsItem, "unit-details");
                const arrow = newUsItem.querySelector('.arrow');
                disableArrow(arrow);
            } else {
                const arrow = newUsItem.querySelector('.arrow');
                arrow.closest('.arrow-wrapper').onclick = (event) => {
                    event.stopPropagation();
                    arrowOnClick(arrow, newUsItem.querySelector('.unit-details'));
                }
            }

            if (unit.isGeneral) {
                // Temporarily disable onchange event
                const icon = newUsItem.querySelector('.general-label');
                const checkbox = newUsItem.querySelector(`.general-checkbox`);
                const originalOnChange = checkbox.onchange;
                checkbox.onchange = null;

                // Set checkbox value
                checkbox.checked = true;
                icon.style.display = 'inline';

                // Restore onchange
                checkbox.onchange = originalOnChange;
            }

            if (unit.isReinforced) {
                // Temporarily disable onchange event
                const icon = newUsItem.querySelector('.reinforced-label');
                const checkbox = newUsItem.querySelector(`.reinforced-checkbox`);
                const originalOnChange = checkbox.onchange;
                checkbox.onchange = null;

                // Set checkbox value
                checkbox.checked = true;
                icon.style.display = 'inline';

                // Restore onchange
                checkbox.onchange = originalOnChange;
            }

            const unitPoints = unitTotalPoints(unit);
            const usPoints = newUsItem.querySelector('.unit-slot-points');
            displayPoints(usPoints, unitPoints, 'PTS');

            let unitHdr = newUsItem.querySelector(".selectable-item-right");
            if (typeof callbackMap === 'string') {
                const regItem = parent.closest('.regiment-item');
                if (regItem) {
                    const _div = regItem.querySelector('.regiment-idx');
                    const _currentRegIdx = Number(_div.textContent);
                    toggleUnitAddButton(regItem, thisPage.roster.regiments[Number(_currentRegIdx)]);
                }
                
                callbackMap = {};
                callbackMap.Duplicate = async (e) => {
                    const regItem = parent.closest('.regiment-item');
                    const _div = regItem.querySelector('.regiment-idx');
                    const _currentRegIdx = Number(_div.textContent);

                    const reg = thisPage.roster.regiments[Number(_currentRegIdx)];
                    const json = JSON.stringify(unit);
                    const clone = JSON.parse(json);
                    reg.units.push(clone);
                    putRoster(roster);
                    
                    toggleUnitAddButton(regItem, reg);

                    await createUnitSlot(parent, clone, reg.units.length-1, 'foo', onclick, isUnit);
                    totalPoints += unitTotalPoints(clone);
                    refreshPointsOverlay();
                    updateValidationDisplay();
                };

                callbackMap.Delete = async (e) => {
                    // get the regiment index, dont assume it hasnt changed
                    const regItem = parent.closest('.regiment-item');
                    let _div = regItem.querySelector('.regiment-idx');
                    const _currentRegIdx = Number(_div.textContent);

                    // get the unit index, don't assume it hasn't changed
                    _div = newUsItem.querySelector('.unit-idx');
                    const _currentIdx = Number(_div.textContent);

                    // remove from the object
                    if (_currentIdx === -1) {
                        thisPage.roster.regiments[_currentRegIdx].leader = null;
                    } else {
                        thisPage.roster.regiments[_currentRegIdx].units.splice(_currentIdx, 1);
                    }
                    putRoster(roster);
                    
                    toggleUnitAddButton(regItem, thisPage.roster.regiments[_currentRegIdx]);

                    // update the points
                    removeObjectPoints(unit);

                    // remove the div and move all of the other unit indices
                    parent.removeChild(newUsItem);
                    const slots = parent.querySelectorAll('.unit-slot');
                    slots.forEach((slot, newIdx) => {
                        const hiddenIdx = slot.querySelector('.unit-idx');
                        hiddenIdx.textContent = newIdx;
                    });
                    toggleUnitAddButton(parent, thisPage.roster.regiments[_currentRegIdx]);
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
            const regimentsDiv = document.getElementById('regiments-container');
            const newRegItem = clonePrototype('regiment-item-prototype');
            newRegItem.id = `regiment-item-of-renown`;
            const regiment = thisPage.roster.regimentOfRenown;

            const deadButton = newRegItem.querySelector('.add-unit-button');
            deadButton.parentElement.removeChild(deadButton);

            const title = newRegItem.querySelector('.regiment-item-title');
            title.innerHTML = `Regiment of Renown`;

            const content = newRegItem.querySelector('.regiment-content');
            
            // slot for the ability
            const addRorAbility = () => {
                const newUsItem = clonePrototype('unit-slot-prototype');
                
                const arrow = newUsItem.querySelector('.arrow');
                arrow.closest('.arrow-wrapper').onclick = (event) => {
                    event.stopPropagation();
                    arrowOnClick(arrow, newUsItem.querySelector('.unit-details'));
                }
                updateSelectableItemPrototype(newUsItem, regiment, true, () => {
                    displayRorOverlay(regiment);
                });

                // these are all for units
                clearDetailsSection(newUsItem);

                const usPoints = newUsItem.querySelector('.unit-slot-points');
                displayPoints(usPoints, regiment.points, 'PTS');

                let unitHdr = newUsItem.querySelector(".selectable-item-right");
                // does nothing but helps positioning be consistant
                const menu = ContextMenu.create({});
                unitHdr.appendChild(menu);

                content.appendChild(newUsItem);
                newUsItem.style.display = "";
                const details = newUsItem.querySelector('.unit-details');
                const detailSection = details.querySelector('.section');
                detailSection.style.display = 'none';
                return details;
            }

            const details = addRorAbility();

            const _createUnitSlot = async (unit) => {
                const newUsItem = clonePrototype('unit-slot-prototype');
                
                updateSelectableItemPrototype(newUsItem, unit, true, () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
                });

                // remove toggle
                removeSection(newUsItem, "unit-details");
                const arrow = newUsItem.querySelector('.arrow');
                disableArrow(arrow);
        
                const usPoints = newUsItem.querySelector('.unit-slot-points');
                usPoints.style.display = 'none';
                usPoints.textContent = '';

                let unitHdr = newUsItem.querySelector(".selectable-item-right");
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

            const pointsSpan = newRegItem.querySelector('.regiment-item-points');
            displayPoints(pointsSpan, regiment.points, 'pts');
            totalPoints += regiment.points;

            const callbackMap = {
                Delete: async (e) => {
                    removeObjectPoints(regiment);
                    thisPage.roster.regimentOfRenown = null;
                    putRoster(roster);
                    regimentsDiv.removeChild(newRegItem);
                }
            };

            const menu = ContextMenu.create(callbackMap);
            const regHdr = newRegItem.querySelector(".regiment-header");
            regHdr.appendChild(menu);

            newRegItem.removeAttribute('style');
            regimentsDiv.appendChild(newRegItem);
            refreshPointsOverlay(thisPage.roster.id);
        }

        async function displayRegiment(index) {
            const regimentsDiv = document.getElementById('regiments-container');
            const regiment = thisPage.roster.regiments[index];
            const newRegItem = clonePrototype('regiment-item-prototype');
            newRegItem.id = '';

            const setInternalIdx = (_regItem, _index) => {
                const hiddenIdx = _regItem.querySelector('.regiment-idx');
                hiddenIdx.textContent = _index;
                _regItem.id = `regiment-item-${_index+1}`;
                const title = _regItem.querySelector('.regiment-item-title');
                title.innerHTML = `Regiment ${_index+1}`;
            }

            setInternalIdx(newRegItem, index);

            const content = newRegItem.querySelector('.regiment-content');

            let points = 0;
            if (regiment.leader) {
                await createUnitSlot(content, regiment.leader, -1, 'defaults', () => {
                    const settings = new WarscrollSettings;
                    settings.unit = regiment.leader;
                    dynamicGoTo(settings);
                }, true);
                points += unitTotalPoints(regiment.leader);
            } else {
                const btn = newRegItem.querySelector('.add-unit-button');
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

            const pointsSpan = newRegItem.querySelector('.regiment-item-points');
            if (points > 0) {
                pointsSpan.textContent = `${points} pts`;
                totalPoints += points;
            }

            const callbackMap = {
                Duplicate: async (e) => {
                    const _div = newRegItem.querySelector('.regiment-idx');
                    const _currentIdx = Number(_div.textContent);
                    const reg = thisPage.roster.regiments[_currentIdx];
                    const json = JSON.stringify(reg);
                    const clone = JSON.parse(json);
                    thisPage.roster.regiments.push(clone);
                    putRoster(roster);
                    displayRegiment(thisPage.roster.regiments.length-1);
                    updateValidationDisplay();

                    if (thisPage.roster.regiments.length > 4) {
                        const btn = document.getElementById('regiments-add-button');
                        btn.disabled = true;
                    }
                },

                Delete: async (e) => {
                    const _div = newRegItem.querySelector('.regiment-idx');
                    const _currentIdx = Number(_div.textContent);
                    const reg = thisPage.roster.regiments[_currentIdx];
                    totalPoints -= unitTotalPoints(reg.leader);
                    reg.units.forEach(unit => {
                        totalPoints -= unitTotalPoints(unit);
                    });
                    thisPage.roster.regiments.splice(_currentIdx, 1);
                    putRoster(roster);
                    refreshPointsOverlay();

                    // remove this regiment
                    regimentsDiv.removeChild(newRegItem);

                    // update remaining regiments
                    const divs = regimentsDiv.querySelectorAll('.regiment-item');
                    divs.forEach((div, idx)=> {
                        setInternalIdx(div, idx);
                    });
                    
                    if (thisPage.roster.regiments.length < 5) {
                        const btn = document.getElementById('regiments-add-button');
                        btn.disabled = false;
                    }
                }
            };

            const menu = ContextMenu.create(callbackMap);
            const regHdr = newRegItem.querySelector(".regiment-header");
            regHdr.appendChild(menu);

            newRegItem.removeAttribute('style');
            regimentsDiv.appendChild(newRegItem);

            refreshPointsOverlay(thisPage.roster.id);
        }

        async function getSpecificUnit(id, useArmy) {
            let url = `${endpoint}/units?id=${id}`;
            if (useArmy) {
                url = `${url}&army=${thisPage.roster.army}`;
            }

            try {
                const result = await fetchWithLoadingDisplay(encodeURI(url));
                return result;
            } catch (error) {
                return null;
            }
        }

        async function getManifestationUnits() {
            const ids = thisPage.roster.lores.manifestation.unitIds;
            let manifestations = [];
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

        function displaySingleton(typename, callbackMap, unit, idx, onclick, isUnit) {
            const parent = document.getElementById(typename);
            
            createUnitSlot(parent, unit, idx, callbackMap, onclick, isUnit);

            const unitsPoints = unitTotalPoints(unit);
            totalPoints += unitsPoints;

            refreshPointsOverlay(thisPage.roster.id);
        }

        function displayAux(idx) {
            const typename = 'auxiliary-units-container';
            const unit = thisPage.roster.auxiliaryUnits[idx];
            const onclick = () => {
                const settings = new WarscrollSettings;
                settings.unit = unit;
                dynamicGoTo(settings);
            };
            
            const callbackMap = {
                Duplicate: async (e) => {
                    const json = JSON.stringify(unit);
                    const clone = JSON.parse(json);
                    thisPage.roster.auxiliaryUnits.push(clone);
                    putRoster(roster);
                    displayAux(thisPage.roster.auxiliaryUnits.length-1);
                },

                Delete: async (e) => {
                    thisPage.roster.auxiliaryUnits.splice(idx, 1);
                    putRoster(roster);
                    
                    const parent = document.getElementById(typename);
                    const slots = parent.querySelectorAll('.unit-slot');
                    slots.forEach(slot => {
                        const hiddenIdx = slot.querySelector('.unit-idx');
                        if (idx === Number(hiddenIdx.textContent)) {
                            parent.removeChild(slot);
                        }
                    });
                }
            };

            displaySingleton(typename, callbackMap, unit, idx, onclick, true);
        }

        function displayTerrain() {
            const typename = 'faction-terrain-container';
            const onclick = () => {
                const settings = new WarscrollSettings;
                settings.unit = thisPage.roster.terrainFeature;
                dynamicGoTo(settings);
            };

            const callbackMap = {
                Replace: async (e) => {
                    thisPage.roster.terrainFeature = null;
                    putRoster(roster);
                    const settings = new UnitSettings;
                    settings.roster = thisPage.roster;
                    settings.type = 'faction terrain';
                    dynamicGoTo(settings);
                },

                Delete: async (e) => {
                    removeObjectPoints(thisPage.roster.terrainFeature);
                    thisPage.roster.terrainFeature = null;
                    await putRoster(roster);
                    const terrain = document.getElementById('faction-terrain-container');
                    terrain.innerHTML = '';
                    const btn = document.getElementById('faction-terrain-add-button');
                    btn.disabled = false;
                }
            };

            displaySingleton(typename, callbackMap, thisPage.roster.terrainFeature, 0, onclick, true);
            const btn = document.getElementById('faction-terrain-add-button');
            btn.disabled = true;
        }

        function displayBattleTraits() {
            const typename = 'battle-traits-&-formation-container';
            const traitNames = Object.getOwnPropertyNames(thisPage.roster.battleTraits);
            const trait = thisPage.roster.battleTraits[traitNames[0]];
            const onclick = () => {
                displayUpgradeOverlay(trait);
            };
            const newUsItem = clonePrototype('unit-slot-prototype');
            
            updateSelectableItemPrototype(newUsItem, trait, false, onclick);

            const usName = newUsItem.querySelector('.unit-text');
            usName.textContent = trait.name.replace("Battle Traits: ", "");

            const label = newUsItem.querySelector('.ability-label');
            label.textContent = 'Battle Traits';

            const usPoints = newUsItem.querySelector('.unit-slot-points');
            usPoints.style.display = 'none';
            usPoints.innerHTML = '';

            removeSection(newUsItem, "unit-details");
            const arrow = newUsItem.querySelector('.arrow');
            disableArrow(arrow);
            
            let unitHdr = newUsItem.querySelector(".selectable-item-right");
            // does nothing but helps positioning be consistant
            const menu = ContextMenu.create({});
            unitHdr.appendChild(menu);

            const parent = document.getElementById(typename);
            parent.appendChild(newUsItem);
            newUsItem.style.display = "";
        }

        function displayBattleFormation() {
            const typename = 'battle-traits-&-formation-container';
            const onclick = () => {
                displayUpgradeOverlay(thisPage.roster.battleFormation);
            }
            
            const callbackMap = {
                Replace: async (e) => {
                    thisPage.roster.battleFormation = null;
                    putRoster(roster);
                    const settings = new UpgradeSettings;
                    settings.titleName = 'Battle Formation';
                    settings.roster = thisPage.roster;
                    settings.type = 'battleFormations';
                    dynamicGoTo(settings);
                }
            };

            displaySingleton(typename, callbackMap, thisPage.roster.battleFormation, 900, onclick, false);
        }

        async function displayLore(name, callbackMap, onclick) {
            const typename = 'lores-container';
            const lcName = name.toLowerCase();
            const parent = document.getElementById(typename);

            const slot = await createUnitSlot(parent, thisPage.roster.lores[lcName], 0, callbackMap, onclick, false);
            slot.id = `${lcName}-slot`;

            const unitsPoints = unitTotalPoints(thisPage.roster.lores[lcName]);
            if (unitsPoints) {
                totalPoints += unitsPoints;
                refreshPointsOverlay(thisPage.roster.id);
            }
        }

        function displaySpellLore() {
            const onclick = () => {
                displayUpgradeOverlay(thisPage.roster.lores.spell);
            }

            const callbackMap = {
                Replace: async (e) => {
                    removeObjectPoints(thisPage.roster.lores.spell);

                    thisPage.roster.lores.spell = null;
                    putRoster(roster);
                    
                    const settings = new UpgradeSettings;
                    settings.titleName = 'Lores';
                    settings.roster = thisPage.roster;
                    settings.type = 'spellLore';
                    dynamicGoTo(settings);
                },

                Delete: async (e) => {
                    removeObjectPoints(thisPage.roster.lores.spell);

                    thisPage.roster.lores.spell = null;
                    await putRoster(roster);
                    
                    const ele = document.getElementById('spell-slot');
                    ele.parentElement.removeChild(ele);

                }
            };
            
            displayLore('Spell', callbackMap, onclick);
        }

        function displayPrayerLore() {
            const onclick = () => {
                displayUpgradeOverlay(thisPage.roster.lores.prayer);
            }

            const callbackMap = {
                Replace: async (e) => {
                    removeObjectPoints(thisPage.roster.lores.prayer);

                    thisPage.roster.lores.prayer = null;
                    putRoster(roster);

                    const settings = new UpgradeSettings;
                    settings.titleName = 'Lores';
                    settings.roster = thisPage.roster;
                    settings.type = 'prayerLore';
                    dynamicGoTo(settings);
                },

                Delete: async (e) => {
                    removeObjectPoints(thisPage.roster.lores.prayer);

                    thisPage.roster.lores.prayer = null;
                    await putRoster(roster);
                    
                    const ele = document.getElementById('prayer-slot');
                    ele.parentElement.removeChild(ele);
                }
            };

            displayLore('Prayer', callbackMap, onclick);
        }

        async function displayManifestLore() {
            const lore = thisPage.roster.lores.manifestation;
            const parent = document.getElementById('lores-container');
            const newUsItem = clonePrototype('unit-slot-prototype');
            
            updateSelectableItemPrototype(newUsItem, lore, false, () => {
                displayUpgradeOverlay(thisPage.roster.lores.manifestation);
            });

            const arrow = newUsItem.querySelector('.arrow');
            arrow.closest('.arrow-wrapper').onclick = (event) => {
                event.stopPropagation();
                arrowOnClick(arrow, newUsItem.querySelector('.unit-details'));
            }
            
            async function displayManifestations() {
                const result = await getManifestationUnits();

                const details = newUsItem.querySelector('.unit-details');
                const detailSection = details.querySelector('.section');
                detailSection.style.display = 'none';

                const createManifestSlot = async (unit, onclick) => {
                    const subUsItem = clonePrototype('unit-slot-prototype');
                    
                    updateSelectableItemPrototype(subUsItem, unit, true, onclick);

                    clearDetailsSection(subUsItem);
                    const arrow = subUsItem.querySelector('.arrow');
                    disableArrow(arrow);

                    const unitPoints = unitTotalPoints(unit);
                    const usPoints = subUsItem.querySelector('.unit-slot-points');
                    displayPoints(usPoints, unitPoints);

                    let unitHdr = subUsItem.querySelector(".selectable-item-right");
                    
                    // does nothing but helps positioning be consistant
                    const menu = ContextMenu.create({});
                    unitHdr.appendChild(menu);

                    unitHdr = subUsItem.querySelector(".unit-slot-selectable-item-wrapper");
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

            
            const usName = newUsItem.querySelector('.unit-text');
            // Find the crown icon
            usName.textContent = lore.name;

            // these are all for units
            clearDetailsSection(newUsItem);

            const unitPoints = unitTotalPoints(lore);
            const usPoints = newUsItem.querySelector('.unit-slot-points');
            displayPoints(usPoints, unitPoints, 'PTS');
            totalPoints += unitPoints;
            refreshPointsOverlay(thisPage.roster.id);

            const callbackMap = {
                Delete: async (e) => {
                    removeObjectPoints(thisPage.roster.lores.manifestation);
                    thisPage.roster.lores.manifestation = null;
                    putRoster(roster);
                    parent.removeChild(newUsItem);
                }
            };
            
            //const regItemMenu = ContextMenu.create(callbackMap);
          //  const regHdr = newRegItem.querySelector(".regiment-header");
            //regHdr.appendChild(regItemMenu);

            const menu = ContextMenu.create(callbackMap);
            let unitHdr = newUsItem.querySelector(".selectable-item-right");
            unitHdr.appendChild(menu);

            parent.appendChild(newUsItem);
            newUsItem.style.display = "";

            displayManifestations();
        }

        async function displayTactics() {
            const typename = 'battle-tactics-container';
            const parent = document.getElementById(typename);
            for (let i = 0; i < thisPage.roster.battleTacticCards.length; ++i) {
                const tactic = thisPage.roster.battleTacticCards[i];

                const onclick = () => {
                    displayTacticsOverlay(tactic);
                }
                
                const callbackMap = {
                    Replace: async (e) => {
                        thisPage.roster.battleTacticCards.splice(i, 1);
                        putRoster(roster);
                        const settings = new TacticsSettings;
                        settings.roster = thisPage.roster;
                        dynamicGoTo(settings);
                    },

                    Delete: async (e) => {
                        if(thisPage.roster.battleTacticCards.length == 2)
                            thisPage.roster.battleTacticCards.splice(i, 1);
                        else
                            thisPage.roster.battleTacticCards = [];
                        await putRoster(roster);

                        const slots = parent.querySelectorAll('.unit-slot');
                        slots.forEach(slot => {
                            const hiddenIdx = slot.querySelector('.unit-idx');
                            if (i === Number(hiddenIdx.textContent)) {
                                parent.removeChild(slot);
                            }
                        });
                    }
                };

                const newItem = await createUnitSlot(parent, tactic, i, callbackMap, onclick, false);
                const label = newItem.querySelector('.ability-label');
                label.textContent = 'Battle Tactic Card';
            }
        }

        async function loadArmy(doGet) {
            if (doGet) {
                
                if (thisPage.roster.isArmyOfRenown) {
                    const btn = document.getElementById('battle-traits-&-formation-add-button');
                    btn.disabled = true;
                }
                displayPointsOverlay(rosterId);
                refreshPointsOverlay(rosterId);
            }

            const upgrades = await thisPage.fetchUpgrades();
            const sections = document.querySelectorAll('.section-container');
            sections.forEach(section => section.innerHTML = '');

            totalPoints = 0;

            for (let i = 0; i < thisPage.roster.regiments.length; ++i)
                await displayRegiment(i);

            if (thisPage.roster.regimentOfRenown)
                displayRegimentOfRenown();

            if ((thisPage.roster.regiments.length + (thisPage.roster.regimentOfRenown ? 1 : 0)) >= 5) {
                const btn = document.getElementById('regiments-add-button');
                btn.disabled = true;
            }

            for (let i = 0; i< thisPage.roster.auxiliaryUnits.length; ++i)
                displayAux(i);

            if (thisPage.roster.terrainFeature) {
                displayTerrain();
            } else {
                const result = await unitsApi.get(this.roster.army);
                const units = Object.values(result);
                const terrain = units.some(unit => unit.type === 7);
                if (!terrain) {
                    const terrainSection = document.getElementById('faction-terrain-section');
                    const tb = terrainSection.querySelector('button');
                    tb.disabled = true;
                }
            }

            displayBattleTraits();

            if (thisPage.roster.battleFormation) 
                displayBattleFormation();

            if (thisPage.roster.lores.spell)
                displaySpellLore();

            if (thisPage.roster.lores.prayer)
                displayPrayerLore();

            if (thisPage.roster.lores.manifestation)
                displayManifestLore();

            if (thisPage.roster.battleTacticCards.length > 0)
                displayTactics();
            
            setHeaderTitle(thisPage.roster.name);
            refreshPointsOverlay(thisPage.roster.id);
            updateValidationDisplay();
        }

        const armyLoadPage = async () => {
            const factory = (main, name) => {
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

                const btn = document.getElementById(`${adjustedName}-add-button`);
                btn.onclick = async () => {
                    if (adjustedName === 'regiments') {
                        let nRegiments = (thisPage.roster.regimentOfRenown ? 1 : 0) + thisPage.roster.regiments.length;
                        if (nRegiments < 5) {
                            thisPage.roster.regiments.push({ leader: null, units: [] });
                            const idx = thisPage.roster.regiments.length - 1;
                            // displayRegiment(idx);
                            await putRoster(roster);

                            // automatically go to adding a leader
                            const settings = new UnitSettings;
                            settings.roster = thisPage.roster;
                            settings.regimentIndex = idx;
                            settings.type = 'hero';
                            dynamicGoTo(settings);
                        }
                    } 
                    else if (adjustedName.includes('auxiliary')) {
                        const settings = new UnitSettings;
                        settings.roster = thisPage.roster;
                        settings.auxiliary = true;
                        dynamicGoTo(settings);
                    }
                    else if (adjustedName.includes('lores')) {
                        const settings = new UpgradeSettings;
                        settings.titleName = 'Lores';
                        settings.roster = thisPage.roster;
                        settings.type = 'lore';
                        dynamicGoTo(settings);
                    }
                    else if (adjustedName.includes('formation')) {
                        const settings = new UpgradeSettings;
                        settings.titleName = 'Battle Formation';
                        settings.type = 'battleFormations';
                        settings.roster = thisPage.roster;
                        dynamicGoTo(settings);
                    }
                    else if (adjustedName.includes('terrain')) {
                        if (!thisPage.roster.terrainFeature) {
                            const settings = new UnitSettings;
                            settings.roster = thisPage.roster;
                            settings.type = 'faction terrain';
                            dynamicGoTo(settings);
                        }
                    }
                    else if (adjustedName.includes('tactic')) {
                        const settings = new TacticsSettings;
                        settings.roster = thisPage.roster
                        dynamicGoTo(settings);
                    }
                    else {
                        alert(`Add new item to ${section}`);
                    }
                }
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
                    bvs.roster = thisPage.roster;
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
                let btn = document.getElementById(`${sectionName}-add-button`);
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