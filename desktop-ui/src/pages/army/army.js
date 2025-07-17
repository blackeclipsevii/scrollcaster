
var totalPoints = 0;
fixedPreviousUrl = '../../index.html';

function updateValidationDisplay() {
    const errors = validateRoster(roster);
    const pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.style.backgroundColor = errors.length > 0 ? 'red' : 'green';

    pointsOverlay.onclick = overlayToggleFactory('block', () =>{
        const modal = document.querySelector(".modal");
        modal.innerHTML = '';
    
        const title = document.createElement('h3');
        title.innerHTML = 'Validation Errors';
        modal.appendChild(title);
    
        const section = document.createElement('div');
        section.style.height = '30em';
        section.style.width = '95%';
    
        errors.forEach(error => {
            const p = document.createElement('p');
            p.innerHTML = `* ${error}`;
            section.appendChild(p);
        });
    
        modal.appendChild(section);
        const offset = (window.innerWidth - modal.clientWidth- getScrollbarWidth()) / 2.0;
        modal.style.marginLeft = `${offset}px`;
    });
};

async function displayEnhancements(unit, newUsItem, type) {
    const details = newUsItem.querySelector(`.available-${type}s`);
    await fetch(encodeURI(`${hostname}:${port}/upgrades?army=${roster.army}`)).
    then(resp => resp.json()).
    then(allUpgrades => {
        const upgrades = allUpgrades[`${type}s`];
        const names = Object.getOwnPropertyNames(upgrades);
        names.forEach(name => {
            const upgrade = upgrades[name];
            const upgradeDiv = document.createElement('div');
            upgradeDiv.class = 'upgrade-group';

            let displayText = name
            const costsPoints = upgrade.points && upgrade.points > 0;
            if (costsPoints)
                displayText = `${name} (${upgrade.points} pts)`;

            upgradeDiv.innerHTML = `
            <div class='upgrade-group-left'>
            <label class="upgrade-label">
                <input type="checkbox" class="upgrade-checkbox">${displayText}
            </label>
            </div>
            <div class='upgrade-group-right'>
            <button class="rectangle-button-small upgrade-button">view</button>
            </div>`;

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
                            if (unitPoints > 0) {
                                usPoints.textContent = `${unitPoints} pts`;
                            } else {
                                usPoints.textContent = '';
                            }
                            totalPoints += upgrade.points;
                            refreshTotalPoints();
                        }
                        updateValidationDisplay();
                    } else if (unit[type].name !== name) {
                        checkbox.checked = false;
                    }
                } else {
                    if (unit[type] && unit[type].name === name) {
                        unit[type] = null;
                        if (costsPoints) {
                            const unitPoints = unitTotalPoints(unit);
                            const usPoints = newUsItem.querySelector('.unit-slot-points');
                            if (unitPoints > 0) {
                                usPoints.textContent = `${unitPoints} pts`;
                            } else {
                                usPoints.textContent = '';
                            }
                            totalPoints -= upgrade.points;
                            refreshTotalPoints();
                        }
                        updateValidationDisplay();
                    }
                }
            };
            details.appendChild(upgradeDiv);
        });
    });
}

function unitTotalPoints(unit) {
    if (!unit.points)
        return 0;

    let pts = unit.points;
    
    if (unit.isReinforced)
        pts += unit.points;

    if ( unit.heroicTrait && unit.heroicTrait.points)
        pts += unit.heroicTrait.points;
    
    if (unit.artefact && unit.artefact.points)
        pts += unit.artefact.points;
    
    return pts;
}

function refreshTotalPoints() {
    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
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

async function createUnitSlot(parent, unit, idx, callbackTag, menuIdxContent, onclick){
    const usPrototype = document.getElementById("unit-slot-prototype");
    const newUsItem = usPrototype.cloneNode(true);
    
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
    if (unitPoints > 0) {
        usPoints.textContent = `${unitPoints} pts`;
    } else {
        usPoints.textContent = '';
    }
    newUsItem.style.padding = "0.5rem";
    newUsItem.style.background = "#ddd";
    newUsItem.style.marginBottom = "0.3rem";
    newUsItem.style.borderRadius = "4px";

    if (!menuIdxContent)
        menuIdxContent = unit.id;

    const menu = createContextMenu(menuIdxContent, menuIdxContent, callbackTag);
    let unitHdr = newUsItem.querySelector(".unit-header-right");
    unitHdr.appendChild(menu);
    unitHdr = newUsItem.querySelector(".unit-header-left");
    unitHdr.onclick = onclick;
    parent.appendChild(newUsItem);
    newUsItem.style.display = "";
}

async function displayRegiment(index) {
    const regimentsDiv = document.getElementById('regiments');
    const prototype = document.getElementById('regiment-item-prototype');
    const regiment = roster.regiments[index];
    const newRegItem = prototype.cloneNode(true);
    const hiddenIdx = newRegItem.querySelector('.regiment-idx');
    hiddenIdx.textContent = index;

    newRegItem.id = `regiment-item-${index+1}`;
    const title = newRegItem.querySelector('.regiment-item-title');
    title.innerHTML = `Regiment ${index+1}`;

    const content = newRegItem.querySelector('.regiment-content');

    let points = 0;
    let uniqueId = roster.id;
    for(let i = 0; i < regiment.units.length; ++i) {
        const unit = regiment.units[i];
        await createUnitSlot(content, unit, i, 'UnitCallback', `${unit.id}:${index}:${i}`, () => {
            window.location.href = `../warscroll/warscroll.html?army=${roster.army}&unit=${unit.name}`;
        });
        uniqueId += unit.id;
        const unitsPoints = unitTotalPoints(unit);
        points += unitsPoints;
    };
    
    const pointsSpan = newRegItem.querySelector('.regiment-item-points');
    pointsSpan.textContent = points > 0 ? `${points} pts` : '';
    totalPoints += points;

    const menu = createContextMenu(uniqueId, index, 'Regiment');
    const regHdr = newRegItem.querySelector(".regiment-header");
    regHdr.appendChild(menu);

    newRegItem.removeAttribute('style');
    regimentsDiv.appendChild(newRegItem);

    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
}

async function getSpecificUnit(id, useArmy) {
    let url = `${hostname}:${port}/units?id=${id}`;
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

async function displayManifestations() {
    const lore = roster.lores.manifestation;

    const loresDiv = document.getElementById('lores');
    const prototype = document.getElementById('regiment-item-prototype');
    const newRegItem = prototype.cloneNode(true);
    newRegItem.id = lore.id;

    const title = newRegItem.querySelector('.regiment-item-title');
    title.innerHTML = lore.name;

    const content = newRegItem.querySelector('.regiment-content');

    const result = await getManifestationUnits();

    for(let i = 0; i < result.units.length; ++i) {
        const unit = result.units[i];
        await createUnitSlot(content, unit, i, 'NO_CALLBACK_ALLOWED', `manifestation-${unit.id}`, () => {
            let url = `../warscroll/warscroll.html?id=${unit.id}`;
            if (result.armyUnits) {
                url = `${url}&army=${roster.army}`
            }
            window.location.href = url;
        });
    };
    
    const pointsSpan = newRegItem.querySelector('.regiment-item-points');
    pointsSpan.textContent = lore.points > 0 ? `${lore.points} pts` : '';
    // totalPoints += points;

    newRegItem.removeAttribute('style');
    loresDiv.appendChild(newRegItem);
}

function displaySingleton(typename, callback, unit, idx, menuIdxContent, onclick) {
    const parent = document.getElementById(typename);
    
    createUnitSlot(parent, unit, idx, callback, menuIdxContent, onclick);

    const unitsPoints = unitTotalPoints(unit);
    totalPoints += unitsPoints;

    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
}

function displayAux(idx) {
    const typename = 'auxiliary';
    const callback = 'AuxUnitCallback';
    const unit = roster.auxiliaryUnits[idx];
    const onclick = () => {
        window.location.href = `../warscroll/warscroll.html?army=${roster.army}&unit=${unit.name}`;
    };
    displaySingleton(typename, callback, unit, idx, idx, onclick);
}

function displayTerrain() {
    const typename = 'terrain';
    const callback = 'TerrainCallback';
    const onclick = () => {
        window.location.href = `../warscroll/warscroll.html?army=${roster.army}&unit=${roster.terrainFeature.name}`;
    };
    displaySingleton(typename, callback, roster.terrainFeature, 0, 0, onclick);
}

function displayBattleTraits() {
    const typename = 'battleTraits';
    const traitNames = Object.getOwnPropertyNames(roster.battleTraits);
    const trait = roster.battleTraits[traitNames[0]];
    const onclick = () => {
        displayUpgradeOverlay(trait);
    };
    const usPrototype = document.getElementById("unit-slot-prototype");
    const newUsItem = usPrototype.cloneNode(true);
    
    const usName = newUsItem.querySelector('.unit-text');
    usName.textContent = trait.name.replace("Battle Traits: ", "");
    newUsItem.style.padding = "0.5rem";
    newUsItem.style.background = "#ddd";
    newUsItem.style.marginBottom = "0.3rem";
    newUsItem.style.borderRadius = "4px";

    const usPoints = newUsItem.querySelector('.unit-slot-points');
    usPoints.innerHTML = '';

    removeSection(newUsItem, "unit-details");
    const arrow = newUsItem.querySelector('.arrow');
    arrow.textContent = '\u2022'; //'\u29BF';
    
    let unitHdr = newUsItem.querySelector(".unit-header-right");
    unitHdr = newUsItem.querySelector(".unit-header-left");
    unitHdr.onclick = onclick;
    const parent = document.getElementById(typename);
    parent.appendChild(newUsItem);
    newUsItem.style.display = "";
}

function displayBattleFormation() {
    const typename = 'battleFormation';
    const callback = 'FormationCallback';
    const onclick = () => {
        displayUpgradeOverlay(roster.battleFormation);
    }
    displaySingleton(typename, callback, roster.battleFormation, 0, 0, onclick);
}

function displaySpellLore() {
    const typename = 'lores';
    const callback = 'SpellLoreCallback';
    const onclick = () => {
        displayUpgradeOverlay(roster.lores.spell);
    }
    displaySingleton(typename, callback, roster.lores.spell, 0, 0, onclick);
}

function displayPrayerLore() {
    const typename = 'lores';
    const callback = 'PrayerLoreCallback';
    const onclick = () => {
        displayUpgradeOverlay(roster.lores.prayer);
    }
    displaySingleton(typename, callback, roster.lores.prayer, 0, 0, onclick);
}

function displayManifestLore() {
    const typename = 'lores';
    const callback = 'ManifestLoreCallback';
    const onclick = () => {
        displayUpgradeOverlay(roster.lores.manifestation);
    }
    displaySingleton(typename, callback, roster.lores.manifestation, 0, 0, onclick);
    displayManifestations();
}

function displayTactics() {
    const typename = 'tactics';
    const callback = 'TacticsCallback';
    const parent = document.getElementById(typename);
    roster.battleTacticCards.forEach((tactic, index) => {
        const onclick = () => {
            displayTacticsOverlay(tactic);
        }
        createUnitSlot(parent, tactic, index, callback, index, onclick);
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
    }

    const sections = document.querySelectorAll('.section-container');
    sections.forEach(section => section.innerHTML = '');

    totalPoints = 0;

    for (let i = 0; i < roster.regiments.length; ++i)
        await displayRegiment(i);

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
    loadScrollData();
    refreshTotalPoints();
    updateValidationDisplay();
}

function toggleUnit(header) {
    console.log('foo')
    const container = header.closest('.unit-header').parentElement;
    const details = container.querySelector('.unit-details');
    if(!details)
        return;
    
    const arrow = container.querySelector('.arrow');
    if (details.style.maxHeight) {
        details.style.maxHeight = null;
        arrow.style.transform = 'rotate(0deg)';
    } else {
        details.style.maxHeight = details.scrollHeight + "px";
        arrow.style.transform = 'rotate(90deg)';
    }
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
    usPoints.textContent = `${ptsAfter} pts`;
    totalPoints = totalPoints - (ptsBefore - ptsAfter);
    refreshTotalPoints();
    updateValidationDisplay();
}


async function addItem(section) {
    const lc = section.toLowerCase() ;
    if (lc === 'regiments') {
        roster.regiments.push({ units: [] });
        const idx = roster.regiments.length - 1;
        // displayRegiment(idx);
        await putRoster(roster);

        // automatically go to adding a leader
        const url = `../units/units.html?id=${roster.id}&regimentIndex=${idx}&army=${roster.army}`;
        window.location.href = encodeURI(`${url}&type=hero`);
    } 
    else if (lc.includes('auxiliary')) {   
        const url = `../units/units.html?id=${roster.id}&auxiliary=true&army=${roster.army}`;
        window.location.href = encodeURI(url);
    }
    else if (lc.includes('lores')) {
        const url = `../upgrades/upgrades.html?id=${roster.id}&type=spellLore&army=${roster.army}`;
        if((!roster.lores.spell && roster.lores.canHaveSpell) || 
            (!roster.lores.manifestation && roster.lores.canHaveManifestation) || 
            (!roster.lores.prayer && roster.lores.canHavePrayer))
            window.location.href = encodeURI(url);
    }
    else if (lc.includes('formation')) {
        const url = `../upgrades/upgrades.html?id=${roster.id}&type=battleFormation&army=${roster.army}`;
        window.location.href = encodeURI(url);
    }
    else if (lc.includes('terrain')) {
        const url = `../units/units.html?id=${roster.id}&army=${roster.army}`;
        if (!roster.terrainFeature)
            window.location.href = encodeURI(`${url}&type=faction terrain`);
    }
    else if (lc.includes('tactic')) {
        const url = `../tactics/tactics.html?id=${roster.id}&army=${roster.army}`;
        if (roster.battleTacticCards.length < 2)
            window.location.href = encodeURI(url);
    }
    else {
        alert(`Add new item to ${section}`);
    }
}

async function hideMenu(item) {
    const menu = item.closest(".menu-wrapper");
    menu.style.display = "none";
}

async function deleteSpellLoreCallback(item) {
    hideMenu(item);
    roster.lores.spell = null;
    await putRoster(roster);
    loadArmy(false);
}

async function deletePrayerLoreCallback(item) {
    hideMenu(item);
    roster.lores.prayer = null;
    await putRoster(roster);
    loadArmy(false);
}

async function deleteManifestLoreCallback (item) {
    hideMenu(item);
    roster.lores.manifestation = null;
    await putRoster(roster);
    loadArmy(false);
}

async function deleteUnitCallback(item) {
    hideMenu(item);

    const menu = item.closest(".menu-wrapper");
    const idxDiv = menu.querySelector(".idx");
    const idxItems = idxDiv.textContent.split(':');
    const regiment = roster.regiments[idxItems[1]];
    if (regiment.units.length > 1 && Number(idxItems[2]) === 0)
        return; // to-do handle deleting the leader

    regiment.units.splice(idxItems[2], 1);
    await putRoster(roster);
    loadArmy(false);
}

async function duplicateUnitCallback(item) {
    hideMenu(item);
    const menu = item.closest(".menu-wrapper");
    const idxDiv = menu.querySelector(".idx");
    const idxItems = idxDiv.textContent.split(':');
    const regiment = roster.regiments[idxItems[1]];
    if (Number(idxItems[2]) === 0)
        return; // to-do handle deleting the leader
    const json = JSON.stringify(regiment.units[idxItems[2]]);
    regiment.units.push(JSON.parse(json));
    await putRoster(roster);
    loadArmy(false);
}

async function deleteAuxUnitCallback(item) {
    hideMenu(item);
    const menu = item.closest(".menu-wrapper");
    const idxDiv = menu.querySelector(".idx");
    const index = Number(idxDiv.textContent);
    roster.auxiliaryUnits.splice(index, 1);
    await putRoster(roster);
    loadArmy(false);
}

async function deleteTacticsCallback(item) {
    hideMenu(item);
    const menu = item.closest(".menu-wrapper");
    const idxDiv = menu.querySelector(".idx");
    const index = Number(idxDiv.textContent);
    roster.battleTacticCards.splice(index, 1);
    await putRoster(roster);
    loadArmy(false);
}

async function deleteFormationCallback(item) {
    hideMenu(item);
    roster.battleFormation = null;
    await putRoster(roster);
    const formation = document.getElementById('battleFormation');
    formation.innerHTML = '';
    updateValidationDisplay();
}


async function deleteTerrainCallback(item) {
    hideMenu(item);
    const points = roster.terrainFeature.points;
    roster.terrainFeature = null;
    await putRoster(roster);
    const terrain = document.getElementById('terrain');
    terrain.innerHTML = '';
    totalPoints -= points;
    refreshTotalPoints();
}

async function duplicateRegiment(item) {
    hideMenu(item);
    const menu = item.closest(".menu-wrapper");
    const idxDiv = menu.querySelector(".idx");
    const index = Number(idxDiv.textContent);

    const json = JSON.stringify(roster.regiments[index]);
    roster.regiments.push(JSON.parse(json));
    displayRegiment(roster.regiments.length - 1);
    await putRoster(roster);
    updateValidationDisplay();
}

async function deleteRegiment(item) {
    hideMenu(item);
    const menu = item.closest(".menu-wrapper");
    const idxDiv = menu.querySelector(".idx");
    const index = Number(idxDiv.textContent);

    roster.regiments.splice(index, 1);
    await putRoster(roster);
    loadArmy(false);
}

function addEntry(button) {
    const parent = button.closest(".regiment-item");
    const idx = Number(parent.id.substring(parent.id.length-1)) - 1;
    const content = parent.querySelector('.regiment-content');
    const count = content.children.length;

    const url = `../units/units.html?id=${roster.id}&regimentIndex=${idx}&army=${roster.army}`;
    if (count === 0) {
        window.location.href = encodeURI(`${url}&type=hero`);
    } else {
        window.location.href = encodeURI(url);
    }
}