
var totalPoints = 0;

function clonePrototype(id, newId = '') {
    const usPrototype = document.getElementById(id);
    const newUsItem = usPrototype.cloneNode(true);
    newUsItem.id = newId;
    newUsItem.style.display = '';
    if (id.includes('unit')) {
        newUsItem.style.padding = "0.4em";
        newUsItem.style.background = "#ddd";
        newUsItem.style.marginBottom = "0.3rem";
        newUsItem.style.borderRadius = "4px";
    }
    return newUsItem;
}

function arrowOnClick(arrow) {
    const container = arrow.closest('.unit-header').parentElement;
    const details = container.querySelector('.unit-details');
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
    await fetch(encodeURI(`${endpoint}/upgrades?army=${roster.army}`)).
    then(resp => resp.json()).
    then(allUpgrades => {
        const upgrades = allUpgrades[`${type}s`];
        const names = Object.getOwnPropertyNames(upgrades);
        names.forEach(name => {
            const upgrade = upgrades[name];
            const upgradeDiv = document.createElement('div');
            upgradeDiv.className = 'upgrade-group';

            upgradeDiv.innerHTML = `
            <div class='upgrade-group-left'>
            <label class="upgrade-label">
                <input type="checkbox" class="upgrade-checkbox">${name}
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
            if (unit[type] && unit[type].name === name) {
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
                            refreshPointsOverlay(roster.id);
                        }
                        updateValidationDisplay();
                        putRoster(roster);
                    } else if (unit[type].name !== name) {
                        checkbox.checked = false;
                    }
                } else {
                    if (unit[type] && unit[type].name === name) {
                        unit[type] = null;
                        if (costsPoints) {
                            const unitPoints = unitTotalPoints(unit);
                            const usPoints = newUsItem.querySelector('.unit-slot-points');
                            displayPoints(usPoints, unitPoints, 'PTS');
                            totalPoints -= upgrade.points;
                            refreshPointsOverlay(roster.id);
                        }
                        updateValidationDisplay();
                        putRoster(roster);
                    }
                }
            };
            details.appendChild(upgradeDiv);
        });
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

async function createUnitSlot(parent, unit, idx, callbackMap, onclick){
    const newUsItem = clonePrototype('unit-slot-prototype');
    
    const hiddenIdx = newUsItem.querySelector('.unit-idx');
    hiddenIdx.textContent = idx;

    const usName = newUsItem.querySelector('.unit-text');
    // Find the crown icon
    usName.textContent = unit.name;

    let numOptions = 4;
    if (unit.type !== 0 || !parent.className.includes('regiment')) {
        removeSection(newUsItem, 'is-general');
        -- numOptions;
    }

    if (!unit.canBeReinforced) {
        removeSection(newUsItem, 'is-reinforced');
        -- numOptions;
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
            arrowOnClick(arrow);
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

    let unitHdr = newUsItem.querySelector(".unit-header-right");
    if (typeof callbackMap === 'string') {
        callbackMap = {};
        callbackMap.Duplicate = async (e) => {
            const regItem = parent.closest('.regiment-item');
            const _div = regItem.querySelector('.regiment-idx');
            const _currentRegIdx = Number(_div.textContent);

            const reg = roster.regiments[Number(_currentRegIdx)];
            const json = JSON.stringify(unit);
            const clone = JSON.parse(json);
            reg.units.push(clone);
            putRoster(roster);
            await createUnitSlot(parent, clone, reg.units.length-1, 'foo', onclick);
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
                roster.regiments[_currentRegIdx].units.splice(_currentIdx, 1);
                putRoster(roster);

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
            }
        } // to-do add replace to unit 0
    }
    if (callbackMap) {
        const menu = createContextMenu(callbackMap);
        unitHdr.appendChild(menu);
    }
    unitHdr = newUsItem.querySelector(".unit-header-left");
    unitHdr.onclick = onclick;
    parent.appendChild(newUsItem);
    newUsItem.style.display = "";
}

async function displayRegimentOfRenown() {
    const regimentsDiv = document.getElementById('regiments');
    const newRegItem = clonePrototype('regiment-item-prototype');
    newRegItem.id = `regiment-item-of-renown`;
    const regiment = roster.regimentOfRenown;

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
            arrowOnClick(arrow);
        }
        
        const usName = newUsItem.querySelector('.unit-text');
        // Find the crown icon
        usName.textContent = regiment.name;

        // these are all for units
        removeSection(newUsItem, 'is-general');
        removeSection(newUsItem, 'is-reinforced');
        removeSection(newUsItem, 'available-artefacts');
        removeSection(newUsItem, 'available-heroicTraits');

        const usPoints = newUsItem.querySelector('.unit-slot-points');
        displayPoints(usPoints, regiment.points, 'PTS');

        let unitHdr = newUsItem.querySelector(".unit-header-right");
        // does nothing but helps positioning be consistant
        const menu = createContextMenu({});
        unitHdr.appendChild(menu);

        unitHdr = newUsItem.querySelector(".unit-header-left");
        unitHdr.onclick = () => {
            displayUpgradeOverlay(roster.regimentOfRenown.upgrades);
        }
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
        
        const usName = newUsItem.querySelector('.unit-text');
        // Find the crown icon
        usName.textContent = unit.name;

        // remove toggle
        removeSection(newUsItem, "unit-details");
        const arrow = newUsItem.querySelector('.arrow');
        arrow.textContent = '\u2022'; //'\u29BF';
   
        const usPoints = newUsItem.querySelector('.unit-slot-points');
        usPoints.style.display = 'none';
        usPoints.textContent = '';

        let unitHdr = newUsItem.querySelector(".unit-header-right");
        // does nothing but helps positioning be consistant
        const menu = createContextMenu({});
        unitHdr.appendChild(menu);

        unitHdr = newUsItem.querySelector(".unit-header-left");
        unitHdr.onclick = () => {
            const key = `readMyScroll_Army`;
            localStorage.setItem(key, JSON.stringify(unit));
            goTo(`../warscroll/warscroll.html?local=${key}`);
        };
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
            roster.regimentOfRenown = null;
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
    refreshPointsOverlay(roster.id);
}

async function displayRegiment(index) {
    const regimentsDiv = document.getElementById('regiments');
    const regiment = roster.regiments[index];
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
    let uniqueId = roster.id;
    for(let i = 0; i < regiment.units.length; ++i) {
        const unit = regiment.units[i];
        
        await createUnitSlot(content, unit, i, 'defaults', () => {
            const key = 'readMyScroll_Army';
            localStorage.setItem(key, JSON.stringify(unit));
            goTo(`../warscroll/warscroll.html?local=${key}`);
        });
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
            const reg = roster.regiments[_currentIdx];
            const json = JSON.stringify(reg);
            const clone = JSON.parse(json);
            roster.regiments.push(clone);
            putRoster(roster);
            displayRegiment(roster.regiments.length-1);
            updateValidationDisplay();
        },

        Delete: async (e) => {
            const _div = newRegItem.querySelector('.regiment-idx');
            const _currentIdx = Number(_div.textContent);
            const reg = roster.regiments[_currentIdx];
            reg.units.forEach(unit => {
                totalPoints -= unitTotalPoints(unit);
            });
            roster.regiments.splice(_currentIdx, 1);
            putRoster(roster);
            refreshPointsOverlay();

            // remove this regiment
            regimentsDiv.removeChild(newRegItem);

            // update remaining regiments
            const divs = regimentsDiv.querySelectorAll('.regiment-item');
            divs.forEach((div, idx)=> {
                setInternalIdx(div, idx);
            });
        }
    };

    const menu = createContextMenu(callbackMap);
    const regHdr = newRegItem.querySelector(".regiment-header");
    regHdr.appendChild(menu);

    newRegItem.removeAttribute('style');
    regimentsDiv.appendChild(newRegItem);

    refreshPointsOverlay(roster.id);
}

async function getSpecificUnit(id, useArmy) {
    let url = `${endpoint}/units?id=${id}`;
    if (useArmy) {
        url = `${url}&army=${roster.army}`;
    }

    try {
        const result = await fetch(encodeURI(url));
        return result.status === 200 ? result.json() : null;
    } catch (error) {
        return null;
    }
}

async function getManifestationUnits() {
    const ids = roster.lores.manifestation.unitIds;
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

function displaySingleton(typename, callbackMap, unit, idx, onclick) {
    const parent = document.getElementById(typename);
    
    createUnitSlot(parent, unit, idx, callbackMap, onclick);

    const unitsPoints = unitTotalPoints(unit);
    totalPoints += unitsPoints;

    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
}

function displayAux(idx) {
    const typename = 'auxiliary';
    const unit = roster.auxiliaryUnits[idx];
    const onclick = () => {
        const key = 'readMyScroll_Army';
        localStorage.setItem(key, JSON.stringify(unit));
        goTo(`../warscroll/warscroll.html?local=${key}`);
    };
    
    const callbackMap = {
        Duplicate: async (e) => {
            const json = JSON.stringify(unit);
            const clone = JSON.parse(json);
            roster.auxiliaryUnits.push(clone);
            putRoster(roster);
            displayAux(roster.auxiliaryUnits.length-1);
        },

        Delete: async (e) => {
            roster.auxiliaryUnits.splice(idx, 1);
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

    displaySingleton(typename, callbackMap, unit, idx, onclick);
}

function displayTerrain() {
    const typename = 'terrain';
    const onclick = () => {
        const key = 'readMyScroll_Army';
        localStorage.setItem(key, JSON.stringify(roster.terrainFeature));
        goTo(`../warscroll/warscroll.html?local=${key}`);
    };

    const callbackMap = {
        Replace: async (e) => {
            roster.terrainFeature = null;
            putRoster(roster);
            const url = `../units/units.html?id=${roster.id}&army=${roster.army}`;
            goTo(encodeURI(`${url}&type=faction terrain`));
        },

        Delete: async (e) => {
            const points = roster.terrainFeature.points;
            roster.terrainFeature = null;
            await putRoster(roster);
            const terrain = document.getElementById('terrain');
            terrain.innerHTML = '';
            totalPoints -= points;
            refreshPointsOverlay(roster.id);
        }
    };

    displaySingleton(typename, callbackMap, roster.terrainFeature, 0, onclick);
}

function displayBattleTraits() {
    const typename = 'battleTraits';
    const traitNames = Object.getOwnPropertyNames(roster.battleTraits);
    const trait = roster.battleTraits[traitNames[0]];
    const onclick = () => {
        displayUpgradeOverlay(trait);
    };
    const newUsItem = clonePrototype('unit-slot-prototype');
    
    const usName = newUsItem.querySelector('.unit-text');
    usName.textContent = trait.name.replace("Battle Traits: ", "");

    const usPoints = newUsItem.querySelector('.unit-slot-points');
    usPoints.style.display = 'none';
    usPoints.innerHTML = '';

    removeSection(newUsItem, "unit-details");
    const arrow = newUsItem.querySelector('.arrow');
    arrow.textContent = '\u2022'; //'\u29BF';
    
    let unitHdr = newUsItem.querySelector(".unit-header-right");
    // does nothing but helps positioning be consistant
    const menu = createContextMenu({});
    unitHdr.appendChild(menu);
    unitHdr = newUsItem.querySelector(".unit-header-left");
    unitHdr.onclick = onclick;
    const parent = document.getElementById(typename);
    parent.appendChild(newUsItem);
    newUsItem.style.display = "";
}

function displayBattleFormation() {
    const typename = 'battleFormation';
    const onclick = () => {
        displayUpgradeOverlay(roster.battleFormation);
    }
    
    const callbackMap = {
        Replace: async (e) => {
            roster.battleFormation = null;
            putRoster(roster);
            const url = `../upgrades/upgrades.html?id=${roster.id}&type=battleFormation&army=${roster.army}`;
            goTo(encodeURI(url));
        }
    };
    displaySingleton(typename, callbackMap, roster.battleFormation, 900, onclick);
}

function displayLore(name, callbackMap, onclick) {
    const typename = 'lores';
    const lcName = name.toLowerCase();
    const parent = document.getElementById(typename);
    const newRegItem = clonePrototype('regiment-item-prototype');
    newRegItem.id = `regiment-item-${lcName}`;
    const deadButton = newRegItem.querySelector('.full-rectangle-button');
    deadButton.parentElement.removeChild(deadButton);

    const title = newRegItem.querySelector('.regiment-item-title');
    title.innerHTML = `${name} Lore`;
    parent.append(newRegItem);
    
    const menu = createContextMenu(callbackMap);
    const regHdr = newRegItem.querySelector(".regiment-header");
    regHdr.appendChild(menu);
    
    createUnitSlot(newRegItem, roster.lores[lcName], 0, {}, onclick);

    const unitsPoints = unitTotalPoints(roster.lores[lcName]);
    if (unitsPoints) {
        totalPoints += unitsPoints;

        let pointsOverlay = document.getElementById('pointsOverlay');
        pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
    }
}

function displaySpellLore() {
    const onclick = () => {
        displayUpgradeOverlay(roster.lores.spell);
    }

    const callbackMap = {
        Replace: async (e) => {
            roster.lores.spell = null;
            putRoster(roster);
            const url = `../upgrades/upgrades.html?id=${roster.id}&type=spellLore&army=${roster.army}`;
            goTo(encodeURI(url));
        },

        Delete: async (e) => {
            roster.lores.spell = null;
            await putRoster(roster);
            
            const parent = document.getElementById('lores');
            const slots = parent.querySelectorAll('.regiment-item');
            slots.forEach(slot => {
                if (slot.id.includes('spell')) {
                    parent.removeChild(slot);
                    return false;
                }
                return true;
            });
        }
    };
    
    displayLore('Spell', callbackMap, onclick);
}

function displayPrayerLore() {
    const onclick = () => {
        displayUpgradeOverlay(roster.lores.prayer);
    }

    const callbackMap = {
        Replace: async (e) => {
            roster.lores.prayer = null;
            putRoster(roster);
            const url = `../upgrades/upgrades.html?id=${roster.id}&type=spellLore&army=${roster.army}`;
            goTo(encodeURI(url));
        },

        Delete: async (e) => {
            roster.lores.prayer = null;
            await putRoster(roster);
            const parent = document.getElementById('lores');
            const slots = parent.querySelectorAll('.regiment-item');
            slots.forEach(slot => {
                if (slot.id.includes('prayer')) {
                    parent.removeChild(slot);
                    return false;
                }
                return true;
            });
        }
    };

    displayLore('Prayer', callbackMap, onclick);
}

async function displayManifestLore() {
    const lore = roster.lores.manifestation;
    const parent = document.getElementById('lores');
    const newRegItem = clonePrototype('regiment-item-prototype');
    newRegItem.id = `regiment-item-manifest`;

    const title = newRegItem.querySelector('.regiment-item-title');
    title.innerHTML = 'Manifestation Lore';
    
    const content = newRegItem.querySelector('.regiment-content');
    const newUsItem = clonePrototype('unit-slot-prototype');
    
    const deadButton = newRegItem.querySelector('.full-rectangle-button');
    deadButton.parentElement.removeChild(deadButton);
    
    const arrow = newUsItem.querySelector('.arrow');
    arrow.onclick = (event) => {
        event.stopPropagation();
        arrowOnClick(arrow);
    }
    
    async function displayManifestations() {
        const result = await getManifestationUnits();

        const details = newUsItem.querySelector('.unit-details');
        const detailSection = details.querySelector('.section');
        detailSection.style.display = 'none';

        const createManifestSlot = async (unit, onclick) => {
            const subUsItem = clonePrototype('unit-slot-prototype');
            
            const usName = subUsItem.querySelector('.unit-text');
            // Find the crown icon
            usName.textContent = unit.name;
            removeSection(subUsItem, 'is-general');
            removeSection(subUsItem, 'is-reinforced');
            removeSection(subUsItem, 'available-artefacts');
            removeSection(subUsItem, 'available-heroicTraits');
            const arrow = subUsItem.querySelector('.arrow');
            arrow.textContent = '\u2022'; //'\u29BF';

            const unitPoints = unitTotalPoints(unit);
            const usPoints = subUsItem.querySelector('.unit-slot-points');
            displayPoints(usPoints, unitPoints);

            let unitHdr = subUsItem.querySelector(".unit-header-right");
            
            // does nothing but helps positioning be consistant
            const menu = createContextMenu({});
            unitHdr.appendChild(menu);

            unitHdr = subUsItem.querySelector(".unit-header-left");
            unitHdr.onclick = onclick;
            details.appendChild(subUsItem);
            subUsItem.style.display = "";
        }

        for(let i = 0; i < result.units.length; ++i) {
            const unit = result.units[i];
            await createManifestSlot(unit, () => {
                const key = 'readMyScroll_Army';
                localStorage.setItem(key, JSON.stringify(unit));
                goTo(`../warscroll/warscroll.html?local=${key}`);
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
    //arrow.textContent = '\u2022'; //'\u29BF';

    const unitPoints = unitTotalPoints(lore);
    const usPoints = newUsItem.querySelector('.unit-slot-points');
    displayPoints(usPoints, unitPoints, 'PTS');
    totalPoints += unitPoints;
    refreshPointsOverlay(roster.id);

    const callbackMap = {
        Delete: async (e) => {
            roster.lores.manifestation = null;
            putRoster(roster);
            parent.removeChild(newRegItem);
        }
    };
    
    const regItemMenu = createContextMenu(callbackMap);
    const regHdr = newRegItem.querySelector(".regiment-header");
    regHdr.appendChild(regItemMenu);

    const menu = createContextMenu({});
    let unitHdr = newUsItem.querySelector(".unit-header-right");
    unitHdr.appendChild(menu);
    unitHdr = newUsItem.querySelector(".unit-header-left");
    unitHdr.onclick = () => {
        displayUpgradeOverlay(roster.lores.manifestation);
    }
    content.appendChild(newUsItem);
    parent.appendChild(newRegItem);
    newUsItem.style.display = "";
    newRegItem.style.display = "";

    displayManifestations();
}

function displayTactics() {
    const typename = 'tactics';
    const parent = document.getElementById(typename);
    roster.battleTacticCards.forEach((tactic, index) => {
        const onclick = () => {
            displayTacticsOverlay(tactic);
        }
        
        const callbackMap = {
            Replace: async (e) => {
                roster.battleTacticCards.splice(index, 1);
                putRoster(roster);
                const url = `../tactics/tactics.html?id=${roster.id}&army=${roster.army}`;
                goTo(encodeURI(url));
            },

            Delete: async (e) => {
                roster.battleTacticCards.splice(index, 1);
                await putRoster(roster);

                const slots = parent.querySelectorAll('.unit-slot');
                slots.forEach(slot => {
                    const hiddenIdx = slot.querySelector('.unit-idx');
                    if (index === Number(hiddenIdx.textContent)) {
                        parent.removeChild(slot);
                    }
                });
            }
        };

        createUnitSlot(parent, tactic, index, callbackMap, onclick);
    });
}

async function loadArmy(doGet) {
    if (doGet) {
        const params = new URLSearchParams(window.location.search);
        const rosterId = params.get('id');
        roster = await getRoster(rosterId);
        if (roster.isArmyOfRenown) {
            const formationEle = document.getElementById('battleFormation');
            if (formationEle) {
                const section = formationEle.closest('.section');
                if (section)
                    section.parentElement.removeChild(section);
            }
        }
        displayPointsOverlay(rosterId);
        refreshPointsOverlay(rosterId);
    }

    const sections = document.querySelectorAll('.section-container');
    sections.forEach(section => section.innerHTML = '');

    totalPoints = 0;

    for (let i = 0; i < roster.regiments.length; ++i)
        await displayRegiment(i);

    if (roster.regimentOfRenown)
        displayRegimentOfRenown();

    for (let i = 0; i< roster.auxiliaryUnits.length; ++i)
        displayAux(i);

    if (roster.terrainFeature)
        displayTerrain();

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

    document.getElementById('army-header').textContent = roster.name;
    refreshPointsOverlay(roster.id);
    updateValidationDisplay();
    loadScrollData();
}

function toggleCrown(checkbox) {
    const unitContainer = checkbox.closest('.unit-slot');
    const crown = unitContainer.querySelector('.general-label');

    crown.style.display = checkbox.checked ? 'inline' : 'none';


    // to-do what about aux general???
    let div = checkbox.closest(".regiment-item");
    div = div.querySelector(".regiment-idx");
    const regIdx = Number(div.textContent);
    const regiment = roster.regiments[regIdx];

    div = checkbox.closest(".unit-slot");
    div = div.querySelector(".unit-idx");
    const unitIdx = Number(div.textContent);
    const unit = regiment.units[unitIdx];

    unit.isGeneral = checkbox.checked;
    putRoster(roster);
    updateValidationDisplay();
}

function toggleReinforced(checkbox) {
    const unitContainer = checkbox.closest('.unit-slot');
    const crown = unitContainer.querySelector('.reinforced-label');

    crown.style.display = checkbox.checked ? 'inline' : 'none';


    // to-do what about aux general???
    let div = checkbox.closest(".regiment-item");
    div = div.querySelector(".regiment-idx");
    const regIdx = Number(div.textContent);
    const regiment = roster.regiments[regIdx];

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
    refreshPointsOverlay(roster.id);
    updateValidationDisplay();
}


async function addItem(section) {
    const lc = section.toLowerCase() ;
    if (lc === 'regiments') {
        let nRegiments = (roster.regimentOfRenown ? 1 : 0) + roster.regiments.length;
        if (nRegiments < 5) {
            roster.regiments.push({ units: [] });
            const idx = roster.regiments.length - 1;
            // displayRegiment(idx);
            await putRoster(roster);

            // automatically go to adding a leader
            const url = `../units/units.html?id=${roster.id}&regimentIndex=${idx}&army=${roster.army}`;
            goTo(encodeURI(`${url}&type=hero`));
        }
    } 
    else if (lc.includes('auxiliary')) {   
        const url = `../units/units.html?id=${roster.id}&auxiliary=true&army=${roster.army}`;
        goTo(encodeURI(url));
    }
    else if (lc.includes('lores')) {
        const url = `../upgrades/upgrades.html?id=${roster.id}&type=spellLore&army=${roster.army}`;
        if((!roster.lores.spell && roster.lores.canHaveSpell) || 
            (!roster.lores.manifestation && roster.lores.canHaveManifestation) || 
            (!roster.lores.prayer && roster.lores.canHavePrayer))
            goTo(encodeURI(url));
    }
    else if (lc.includes('formation')) {
        const url = `../upgrades/upgrades.html?id=${roster.id}&type=battleFormation&army=${roster.army}`;
        goTo(encodeURI(url));
    }
    else if (lc.includes('terrain')) {
        const url = `../units/units.html?id=${roster.id}&army=${roster.army}`;
        if (!roster.terrainFeature)
            goTo(encodeURI(`${url}&type=faction terrain`));
    }
    else if (lc.includes('tactic')) {
        const url = `../tactics/tactics.html?id=${roster.id}&army=${roster.army}`;
        if (roster.battleTacticCards.length < 2)
            goTo(encodeURI(url));
    }
    else {
        alert(`Add new item to ${section}`);
    }
}

async function hideMenu(item) {
    const menu = item.closest(".menu-wrapper");
    menu.style.display = "none";
}

function addEntry(button) {
    const parent = button.closest(".regiment-item");
    const idx = Number(parent.id.substring(parent.id.length-1)) - 1;
    const content = parent.querySelector('.regiment-content');
    const count = content.children.length;

    const url = `../units/units.html?id=${roster.id}&regimentIndex=${idx}&army=${roster.army}`;
    if (count === 0) {
        goTo(encodeURI(`${url}&type=hero`));
    } else {
        goTo(encodeURI(url));
    }
}