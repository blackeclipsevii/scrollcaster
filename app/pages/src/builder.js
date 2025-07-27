
var totalPoints = 0;

class BuilderSettings {
    rosterId = null;
    roster = null;
};

const builderPage = {
    roster: null,
    settings: null,
    _cache: {
        upgrades: null,
        armyName: null
    },
    async fetchUpgrades() {
        if(this._cache.upgrades && this._cache.armyName === this.roster.army)
            return this._cache.upgrades;
        const url = encodeURI(`${endpoint}/upgrades?army=${this.roster.army}`);
        const result = await fetch(url).then(resp => resp.json()).catch(_ => null);
        if (result){
            this._cache.upgrades = result;
            this._cache.armyName = this.roster.army;
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

        function _newUnitSlot() {
            const unitSlot = document.createElement('div');

            unitSlot.innerHTML = `
                <span style="display: none;" class="unit-idx"></span>
                <div class='unit-slot-display-wrapper'>
                <span class="arrow">
                ›
                </span>
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
                    
                    <div class="section upgrade-section available-artefacts">
                        <h3 class="section-title">Artefacts of Power:</h3>
                    </div>
                    
                    <div class="section upgrade-section available-heroicTraits">
                        <h3 class="section-title">Heroic Traits:</h3>
                    </div>

                    <div class="section upgrade-section available-monstrousTraits">
                        <h3 class="section-title">Monstrous Traits:</h3>
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
            <div class="clickable-style" style="display: flex; align-items: center; gap: 0.5rem;">
                <button class="full-rectangle-button">Add Unit +</button>
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
                if (count === 0) {
                    settings.type = 'hero';
                }

                dynamicGoTo(settings);
            };
            return div;
        }

        function updateSelectableItemPrototype(prototype, displayableObj, isUnit, leftOnClick) {
            const left = prototype.querySelector('.selectable-item-left');
            left.addEventListener('click', leftOnClick);

            const nameEle = makeSelectableItemName(displayableObj);
            nameEle.classList.add('unit-text');
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

        async function displayEnhancements(unit, newUsItem, type) {
            const details = newUsItem.querySelector(`.available-${type}s`);
            const allUpgrades = await thisPage.fetchUpgrades();
            const upgrades = allUpgrades[`${type}s`];
            const values = Object.values(upgrades);
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
                if (unit[type] && unit[type].name === upgrade.name) {
                    checkbox.checked = true;
                }

                checkbox.onchange = () => {
                    if (checkbox.checked) {
                        if (!unit[type]) {
                            unit[type] = upgrade;
                            if (costsPoints) {
                                const unitPoints = unitTotalPoints(unit);
                                const usPoints = newUsItem.querySelector('.unit-slot-points');
                                displayPoints(usPoints, unitPoints, 'PTS');
                                totalPoints += upgrade.points;
                                refreshPointsOverlay(thisPage.roster.id);
                            }
                            updateValidationDisplay();
                            putRoster(roster);
                        } else if (unit[type].name !== upgrade.name) {
                            checkbox.checked = false;
                        }
                    } else {
                        if (unit[type] && unit[type].name === upgrade.name) {
                            unit[type] = null;
                            if (costsPoints) {
                                const unitPoints = unitTotalPoints(unit);
                                const usPoints = newUsItem.querySelector('.unit-slot-points');
                                displayPoints(usPoints, unitPoints, 'PTS');
                                totalPoints -= upgrade.points;
                                refreshPointsOverlay(thisPage.roster.id);
                            }
                            updateValidationDisplay();
                            putRoster(roster);
                        }
                    }
                };
                details.appendChild(upgradeDiv);
            });
        }

        const exportListAndDisplay = overlayToggleFactory('block', () =>{
            const text = exportRoster(roster);
            const modal = document.querySelector(".modal");
            modal.innerHTML = '';

            const section = document.createElement('textarea');
            section.innerHTML = text;
            section.style.height = '30em';
            section.style.width = '95%';

            const copyButton = document.createElement('button');
            copyButton.className = 'full-rectangle-button';
            copyButton.textContent = 'Copy to Clipboard';
            copyButton.onclick = () => {
                copyToClipboard(text);
                disableOverlay();
            };

            modal.appendChild(section);
            modal.appendChild(copyButton);
            const offset = (window.innerWidth - modal.clientWidth- getScrollbarWidth()) / 2.0;
            modal.style.marginLeft = `${offset}px`;
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
            const newUsItem = clonePrototype('unit-slot-prototype');
            
            const hiddenIdx = newUsItem.querySelector('.unit-idx');
            hiddenIdx.textContent = idx;

            let numOptions = 5;
            const canBeGeneral = !(unit.type !== 0 || !parent.className.includes('regiment'));
            if (unit.type !== 0 || !parent.className.includes('regiment')) {
                removeSection(newUsItem, 'is-general');
                -- numOptions;
            } else {
                const checkbox = newUsItem.querySelector('.general-checkbox');
                checkbox.onchange = () => {
                    const unitContainer = checkbox.closest('.unit-slot');
                    const crown = unitContainer.querySelector('.general-label');

                    crown.style.display = checkbox.checked ? 'inline' : 'none';

                    let div = checkbox.closest(".regiment-item");
                    div = div.querySelector(".regiment-idx");
                    const regIdx = Number(div.textContent);
                    const regiment = thisPage.roster.regiments[regIdx];

                    div = checkbox.closest(".unit-slot");
                    div = div.querySelector(".unit-idx");
                    const unitIdx = Number(div.textContent);
                    const unit = regiment.units[unitIdx];

                    unit.isGeneral = checkbox.checked;
                    putRoster(roster);
                    updateValidationDisplay();
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
                -- numOptions;
            } else {
                const checkbox = newUsItem.querySelector('.reinforced-checkbox');
                checkbox.onchange = () => {
                    const unitContainer = checkbox.closest('.unit-slot');
                    const crown = unitContainer.querySelector('.reinforced-label');

                    crown.style.display = checkbox.checked ? 'inline' : 'none';

                    // to-do what about aux general???
                    let div = checkbox.closest(".regiment-item");
                    div = div.querySelector(".regiment-idx");
                    const regIdx = Number(div.textContent);
                    const regiment = thisPage.roster.regiments[regIdx];

                    div = checkbox.closest(".unit-slot");
                    div = div.querySelector(".unit-idx");
                    const unitIdx = Number(div.textContent);
                    const unit = regiment.units[unitIdx];

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

            if (!unit.canHaveArtefact) {
                removeSection(newUsItem, 'available-artefacts');
                -- numOptions;
            } else {
                await displayEnhancements(unit, newUsItem, 'artefact');
            }

            if (!unit.canHaveHeroicTrait) {
                removeSection(newUsItem, 'available-heroicTraits');
                -- numOptions;
            } else {
                await displayEnhancements(unit, newUsItem, 'heroicTrait');
            }

            const upgrades = await thisPage.fetchUpgrades();
            const hasMonstrousTraits = Object.getOwnPropertyNames(upgrades.monstrousTraits).length > 0;
            const isMonster = unit.keywords && unit.keywords.includes('MONSTER');
            const isUnique = unit.keywords && unit.keywords.includes('UNIQUE');
            if (!hasMonstrousTraits || !isMonster || isUnique) {
                removeSection(newUsItem, 'available-monstrousTraits');
                -- numOptions;
            } else {
                await displayEnhancements(unit, newUsItem, 'monstrousTrait');
            }

            if (numOptions < 1) {
                // remove toggle
                // removeSection(newUsItem, "arrow");
                removeSection(newUsItem, "unit-details");
                const arrow = newUsItem.querySelector('.arrow');
                arrow.textContent = '\u2022'; //'\u29BF';
            } else {
                const arrow = newUsItem.querySelector('.arrow');
                arrow.onclick = (event) => {
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
                const toggleUnitAddButton = (regItem, _regiment) => {
                    const btn = regItem.querySelector('.full-rectangle-button');
                    let maxUnits = 4;
                    if (_regiment.units.length > 0 && _regiment.units[0].isGeneral)
                        maxUnits = 6;
                    btn.disabled = _regiment.units.length >= maxUnits;
                }
                
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

                if (idx > 0) {
                    callbackMap.Delete = async (e) => {
                        // get the regiment index, dont assume it hasnt changed
                        const regItem = parent.closest('.regiment-item');
                        let _div = regItem.querySelector('.regiment-idx');
                        const _currentRegIdx = Number(_div.textContent);

                        // get the unit index, don't assume it hasn't changed
                        _div = newUsItem.querySelector('.unit-idx');
                        const _currentIdx = Number(_div.textContent);

                        // remove from the object
                        thisPage.roster.regiments[_currentRegIdx].units.splice(_currentIdx, 1);
                        putRoster(roster);
                        
                        toggleUnitAddButton(regItem, thisPage.roster.regiments[_currentRegIdx]);

                        // update the points
                        totalPoints -= unitTotalPoints(unit);
                        refreshPointsOverlay();
                        updateValidationDisplay();

                        // remove the div and move all of the other unit indices
                        parent.removeChild(newUsItem);
                        const slots = parent.querySelectorAll('.unit-slot');
                        slots.forEach((slot, newIdx) => {
                            const hiddenIdx = slot.querySelector('.unit-idx');
                            hiddenIdx.textContent = newIdx;
                        });
                        toggleUnitAddButton(parent, thisPage.roster.regiments[_currentRegIdx]);
                    }
                } // to-do add replace to unit 0
            }
            if (callbackMap) {
                const menu = createContextMenu(callbackMap);
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

            const deadButton = newRegItem.querySelector('.full-rectangle-button');
            deadButton.parentElement.removeChild(deadButton);

            const title = newRegItem.querySelector('.regiment-item-title');
            title.innerHTML = `Regiment of Renown`;

            const content = newRegItem.querySelector('.regiment-content');
            
            // slot for the ability
            const addRorAbility = () => {
                const newUsItem = clonePrototype('unit-slot-prototype');
                
                const arrow = newUsItem.querySelector('.arrow');
                //arrow.textContent = '\u2022'; //'\u29BF';
                arrow.onclick = (event) => {
                    event.stopPropagation();
                    arrowOnClick(arrow, newUsItem.querySelector('.unit-details'));
                }
                updateSelectableItemPrototype(newUsItem, regimentOfRenown, true, () => {
                    displayUpgradeOverlay(thisPage.roster.regimentOfRenown.upgrades);
                });
                // these are all for units
                removeSection(newUsItem, 'is-general');
                removeSection(newUsItem, 'is-reinforced');
                removeSection(newUsItem, 'available-artefacts');
                removeSection(newUsItem, 'available-heroicTraits');
                removeSection(newUsItem, 'available-monstrousTraits');

                const usPoints = newUsItem.querySelector('.unit-slot-points');
                displayPoints(usPoints, regiment.points, 'PTS');

                let unitHdr = newUsItem.querySelector(".selectable-item-right");
                // does nothing but helps positioning be consistant
                const menu = createContextMenu({});
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
                arrow.textContent = '\u2022'; //'\u29BF';
        
                const usPoints = newUsItem.querySelector('.unit-slot-points');
                usPoints.style.display = 'none';
                usPoints.textContent = '';

                let unitHdr = newUsItem.querySelector(".selectable-item-right");
                // does nothing but helps positioning be consistant
                const menu = createContextMenu({});
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
                    totalPoints -= regiment.points;
                    thisPage.roster.regimentOfRenown = null;
                    refreshPointsOverlay();
                    putRoster(roster);
                    regimentsDiv.removeChild(newRegItem);
                }
            };

            const menu = createContextMenu(callbackMap);
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
            let uniqueId = thisPage.roster.id;
            for(let i = 0; i < regiment.units.length; ++i) {
                const unit = regiment.units[i];
                
                await createUnitSlot(content, unit, i, 'defaults', () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
                }, true);
                uniqueId += unit.id;
                const unitsPoints = unitTotalPoints(unit);
                points += unitsPoints;
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

            const menu = createContextMenu(callbackMap);
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
                const result = await fetch(encodeURI(url));
                return result.status === 200 ? result.json() : null;
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

            let pointsOverlay = document.getElementById('pointsOverlay');
            pointsOverlay.textContent = `${totalPoints} / ${thisPage.roster.points} pts`;
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
                    const points = thisPage.roster.terrainFeature.points;
                    thisPage.roster.terrainFeature = null;
                    await putRoster(roster);
                    const terrain = document.getElementById('faction-terrain-container');
                    terrain.innerHTML = '';
                    totalPoints -= points;
                    refreshPointsOverlay(thisPage.roster.id);
                    const btn = document.getElementById('faction-terrain-add-button');
                    btn.disabled = false;
                }
            };

            displaySingleton(typename, callbackMap, thisPage.roster.terrainFeature, 0, onclick, true);
            const btn = document.getElementById('faction-terrain-add-button');
            btn.disabled = true;
        }

        function displayBattleTraits() {
            const typename = 'battle-traits-container';
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
            arrow.textContent = '\u2022'; //'\u29BF';
            
            let unitHdr = newUsItem.querySelector(".selectable-item-right");
            // does nothing but helps positioning be consistant
            const menu = createContextMenu({});
            unitHdr.appendChild(menu);

            const parent = document.getElementById(typename);
            parent.appendChild(newUsItem);
            newUsItem.style.display = "";
        }

        function displayBattleFormation() {
            const typename = 'battle-formation-container';
            const onclick = () => {
                displayUpgradeOverlay(thisPage.roster.battleFormation);
            }
            
            const callbackMap = {
                Replace: async (e) => {
                    thisPage.roster.battleFormation = null;
                    putRoster(roster);
                    const settings = new UpgradeSettings;
                    settings.roster = thisPage.roster;
                    settings.type = 'battleFormations';
                    dynamicGoTo(settings);
                }
            };

            displaySingleton(typename, callbackMap, thisPage.roster.battleFormation, 900, onclick, false);
            const btn = document.getElementById('battle-formation-add-button');
            btn.disabled = true;
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

                let pointsOverlay = document.getElementById('pointsOverlay');
                pointsOverlay.textContent = `${totalPoints} / ${thisPage.roster.points} pts`;
            }
        }

        function displaySpellLore() {
            const onclick = () => {
                displayUpgradeOverlay(thisPage.roster.lores.spell);
            }

            const callbackMap = {
                Replace: async (e) => {
                    thisPage.roster.lores.spell = null;
                    putRoster(roster);
                    const settings = new UpgradeSettings;
                    settings.roster = thisPage.roster;
                    settings.type = 'spellLore';
                    dynamicGoTo(settings);
                },

                Delete: async (e) => {
                    thisPage.roster.lores.spell = null;
                    await putRoster(roster);
                    
                    const ele = document.getElementById('spell-slot');
                    ele.parentElement.removeChild(ele);

                    const btn = document.getElementById('lores-add-button');
                    btn.disabled = false;
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
                    thisPage.roster.lores.prayer = null;
                    putRoster(roster);
                    const settings = new UpgradeSettings;
                    settings.roster = thisPage.roster;
                    dynamicGoTo(settings);
                },

                Delete: async (e) => {
                    thisPage.roster.lores.prayer = null;
                    await putRoster(roster);
                    
                    const ele = document.getElementById('prayer-slot');
                    ele.parentElement.removeChild(ele);

                    const btn = document.getElementById('lores-add-button');
                    btn.disabled = false;
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
            arrow.onclick = (event) => {
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

                    removeSection(subUsItem, 'is-general');
                    removeSection(subUsItem, 'is-reinforced');
                    removeSection(subUsItem, 'available-artefacts');
                    removeSection(subUsItem, 'available-heroicTraits');
                    removeSection(subUsItem, 'available-monstrousTraits');
                    const arrow = subUsItem.querySelector('.arrow');
                    arrow.textContent = '\u2022'; //'\u29BF';

                    const unitPoints = unitTotalPoints(unit);
                    const usPoints = subUsItem.querySelector('.unit-slot-points');
                    displayPoints(usPoints, unitPoints);

                    let unitHdr = subUsItem.querySelector(".selectable-item-right");
                    
                    // does nothing but helps positioning be consistant
                    const menu = createContextMenu({});
                    unitHdr.appendChild(menu);

                    unitHdr = subUsItem.querySelector(".selectable-item-left");
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
            removeSection(newUsItem, 'is-general');
            removeSection(newUsItem, 'is-reinforced');
            removeSection(newUsItem, 'available-artefacts');
            removeSection(newUsItem, 'available-heroicTraits');
            removeSection(newUsItem, 'available-monstrousTraits');
            //arrow.textContent = '\u2022'; //'\u29BF';

            const unitPoints = unitTotalPoints(lore);
            const usPoints = newUsItem.querySelector('.unit-slot-points');
            displayPoints(usPoints, unitPoints, 'PTS');
            totalPoints += unitPoints;
            refreshPointsOverlay(thisPage.roster.id);

            const callbackMap = {
                Delete: async (e) => {
                    thisPage.roster.lores.manifestation = null;
                    putRoster(roster);
                    parent.removeChild(newUsItem);
                    const btn = document.getElementById('lores-add-button');
                    btn.disabled = false;
                }
            };
            
            //const regItemMenu = createContextMenu(callbackMap);
          //  const regHdr = newRegItem.querySelector(".regiment-header");
            //regHdr.appendChild(regItemMenu);

            const menu = createContextMenu(callbackMap);
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
                        thisPage.roster.battleTacticCards.splice(i, 1);
                        await putRoster(roster);

                        const slots = parent.querySelectorAll('.unit-slot');
                        slots.forEach(slot => {
                            const hiddenIdx = slot.querySelector('.unit-idx');
                            if (i === Number(hiddenIdx.textContent)) {
                                parent.removeChild(slot);
                            }
                        });

                        const btn = document.getElementById('battle-tactics-add-button');
                        btn.disabled = false;
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
                    const formationEle = document.getElementById('battle-formation-container');
                    if (formationEle) {
                        const section = formationEle.closest('.section');
                        if (section)
                            section.parentElement.removeChild(section);
                    }
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

            if (thisPage.roster.terrainFeature)
                displayTerrain();

            displayBattleTraits();

            if (thisPage.roster.battleFormation) 
                displayBattleFormation();


            let nLores = 1;
            if (Object.getOwnPropertyNames(upgrades.lores.spell).length > 0)
                nLores ++;
            if (Object.getOwnPropertyNames(upgrades.lores.prayer).length > 0)
                nLores ++;

            if (thisPage.roster.lores.spell) {
                displaySpellLore();
                nLores --;
            }

            if (thisPage.roster.lores.prayer) {
                displayPrayerLore();
                nLores --;
            }

            if (thisPage.roster.lores.manifestation) {
                displayManifestLore();
                nLores --;
            }

            if (nLores === 0) {
                const btn = document.getElementById('lores-add-button');
                btn.disabled = true;
            }

            if (thisPage.roster.battleTacticCards.length > 0)
                displayTactics();

            if (thisPage.roster.battleTacticCards.length === 2) {
                const btn = document.getElementById('battle-tactics-add-button');
                btn.disabled = true;
            }
            
            setHeaderTitle(thisPage.roster.name);
            refreshPointsOverlay(thisPage.roster.id);
            updateValidationDisplay();
        }

        const armyLoadPage = async () => {
            const factory = (main, name) => {
                const adjustedName = name.toLowerCase().replace(/ /g, '-');
                const section = document.createElement('div');
                // section.style.display = 'none';
                section.className = 'section';
                section.id = `${adjustedName}-section`;
                section.innerHTML = `
                    <h3 id="${adjustedName}-section-title" class="section-title">${name}
                    <button id="${adjustedName}-add-button" class="rectangle-button">+</button>
                    </h3>
                    <div class="section-container" id="${adjustedName}-container"></div>
                `;
                main.appendChild(section);

                const btn = document.getElementById(`${adjustedName}-add-button`);
                btn.onclick = async () => {
                    if (adjustedName === 'regiments') {
                        let nRegiments = (thisPage.roster.regimentOfRenown ? 1 : 0) + thisPage.roster.regiments.length;
                        if (nRegiments < 5) {
                            thisPage.roster.regiments.push({ units: [] });
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
                        if((!thisPage.roster.lores.spell && thisPage.roster.lores.canHaveSpell) || 
                            (!thisPage.roster.lores.manifestation && thisPage.roster.lores.canHaveManifestation) || 
                            (!thisPage.roster.lores.prayer && thisPage.roster.lores.canHavePrayer)) {
                            
                            const settings = new UpgradeSettings;
                            settings.type = 'spellLore';
                            settings.roster = thisPage.roster;
                            dynamicGoTo(settings);
                        }
                    }
                    else if (adjustedName.includes('formation')) {
                        const settings = new UpgradeSettings;
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
                'Battle Traits',
                'Battle Formation',
                'Lores',
                'Battle Tactics',
                'Faction Terrain'
            ];

            updateHeaderContextMenu({ 'Export List': exportListAndDisplay });
            makeLayout(sections, factory);

            let btn = document.getElementById('battle-formation-add-button');
            btn.textContent = '⚙︎';
            btn = document.getElementById('faction-terrain-add-button');
            btn.textContent = '⚙︎';
            let title = document.getElementById('battle-traits-section-title');
            title.textContent = 'Battle Traits';

            await loadArmy(true);
            swapLayout();
        }

        await armyLoadPage();
    }
};

dynamicPages['builder'] = builderPage;

// (async () => {
//   const settings = new BuilderSettings
//   roster = await getRoster('e6d0831b-d3e3-4342-87f7-1c68a2b4bebf');
//   settings.roster = roster;
//   _linkStack['roster'].currentSettings = settings;
//   dynamicGoTo(settings);
// })();