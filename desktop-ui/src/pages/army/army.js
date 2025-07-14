
var roster;
var totalPoints = 0;

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

function exportList() {

}

function removeSection(section, className) {
    const child = section.querySelector(`.${className}`);
    if (child) {
        child.parentElement.removeChild(child);
    } else {
        console.log (`failed to remove ${className}`)
    }
}

function createUnitSlot(parent, unit, idx, callbackTag){
    const usPrototype = document.getElementById("unit-slot-prototype");
    const newUsItem = usPrototype.cloneNode(true);
    
    const hiddenIdx = newUsItem.querySelector('.unit-idx');
    hiddenIdx.textContent = idx;

    const usName = newUsItem.querySelector('.unit-text');
    // Find the crown icon
    usName.textContent = unit.name;

    numOptions = 4;
    if (unit.type !== 0) {
        removeSection(newUsItem, 'is-general');
        -- numOptions;
    }
    if (!unit.canBeReinforced) {
        removeSection(newUsItem, 'is-reinforced');
        -- numOptions;
    }
    if (!unit.canHaveArtefact) {
        removeSection(newUsItem, 'add-artifact');
        -- numOptions;
    }
    if (!unit.canHaveHeroicTrait) {
        removeSection(newUsItem, 'add-trait');
        -- numOptions;
    }

    if (numOptions < 1) {
        // remove toggle
        // removeSection(newUsItem, "arrow");
        removeSection(newUsItem, "unit-details");
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

    const menu = createContextMenu(unit.id, unit.id, callbackTag);
    const unitHdr = newUsItem.querySelector(".unit-header-right");
    unitHdr.appendChild(menu);
    parent.appendChild(newUsItem);
    newUsItem.style.display = "";
}

function displayRegiment(index) {
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
    regiment.units.forEach((unit, idx) => {
        createUnitSlot(content, unit, idx, 'UnitCallback');
        uniqueId += unit.id;
        const unitsPoints = unitTotalPoints(unit);
        points += unitsPoints;
    });
    
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

function displaySingleton(typename, callback, unit, idx) {
    const parent = document.getElementById(typename);
    
    createUnitSlot(parent, unit, idx, callback);

    const unitsPoints = unitTotalPoints(unit);
    totalPoints += unitsPoints;

    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
}

function displayAux(idx) {
    const typename = 'auxiliary';
    const callback = 'AuxUnitCallback';
    const unit = roster.auxiliaryUnits[idx];
    displaySingleton(typename, callback, unit, idx);
}

function displayTerrain() {
    const typename = 'terrain';
    const callback = 'TerrainCallback';
    displaySingleton(typename, callback, roster.terrainFeature, 0);
}

function displayBattleFormation() {
    const typename = 'battleFormation';
    const callback = 'FormationCallback';
    displaySingleton(typename, callback, roster.battleFormation, 0);
}

function displaySpellLore() {
    const typename = 'lores';
    const callback = 'SpellLoreCallback';
    displaySingleton(typename, callback, roster.spellLore, 0);
}

function displayManifestLore() {
    const typename = 'lores';
    const callback = 'ManifestLoreCallback';
    displaySingleton(typename, callback, roster.manifestationLore, 0);
}

async function loadArmy(doGet) {
    if (doGet) {
        const params = new URLSearchParams(window.location.search);
        const rosterId = params.get('id');
        roster = await getRoster(rosterId);
    }
    
    const divIds = ['regiments', 'auxiliary', 'lores', 'tactics', 'terrain'];
    divIds.forEach(id => {
        const div = document.getElementById(id);
        div.innerHTML = '';
    });
    totalPoints = 0;

    for (let i = 0; i < roster.regiments.length; ++i)
        displayRegiment(i);

    for (let i = 0; i< roster.auxiliaryUnits.length; ++i)
        displayAux(i);

    if (roster.terrainFeature) {
        displayTerrain();
        const terrain = document.getElementById('terrain');
        const section = terrain.closest('.section');
        const button = section.querySelector('.round-button');
        button.disabled = true;
    }

    if (roster.battleFormation)
        displayBattleFormation();

    if (roster.spellLore)
        displaySpellLore();

    if (roster.manifestationLore)
        displayManifestLore();

    document.getElementById('army-header').textContent = roster.name;
    loadScrollData();
}

function toggleUnit(header) {
    const container = header.parentElement;
    const details = container.querySelector('.unit-details');
    if(!details)
        return;
    
    const arrow = header.querySelector('.arrow');
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
        window.location.href = encodeURI(url);
    }
    else if (lc.includes('formation')) {
        const url = `../upgrades/upgrades.html?id=${roster.id}&type=battleFormation&army=${roster.army}`;
        window.location.href = encodeURI(url);
    }
    else if (lc.includes('terrain')) {
        const url = `../units/units.html?id=${roster.id}&army=${roster.army}`;
        window.location.href = encodeURI(`${url}&type=faction terrain`);
    }
    else {
        alert(`Add new item to ${section}`);
    }
}

async function deleteAuxUnitCallback(item) {
    const menu = item.closest(".menu-wrapper");
    menu.style.display = "none";
    const idxDiv = menu.querySelector(".idx");
    const index = Number(idxDiv.textContent);
    roster.auxiliaryUnits.splice(index, 1);
    await putRoster(roster);
    loadArmy(false);
}

async function deleteTerrainCallback(item) {
    console.log('terrain callback');
    const points = terrainFeature.points;
    roster.terrainFeature = null;
    await putRoster(roster);
    const terrain = document.getElementById('terrain');
    terrain.innerHTML = '';
    totalPoints -= points;
    refreshTotalPoints();
}

async function duplicateRegiment(item) {
    const menu = item.closest(".menu-wrapper");
    menu.style.display = "none";
    const idxDiv = menu.querySelector(".idx");
    const index = Number(idxDiv.textContent);

    const json = JSON.stringify(roster.regiments[index]);
    roster.regiments.push(JSON.parse(json));
    displayRegiment(roster.regiments.length - 1);
    await putRoster(roster);
}

async function deleteRegiment(item) {
    const menu = item.closest(".menu-wrapper");
    menu.style.display = "none";
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