

const unitTypeToString = (unit) => {
    if (unit.type === 0)
        return 'Hero';
    if (unit.type == 1)
        return 'Infantry';
    if (unit.type == 2)
        return 'Cavalry';
    if (unit.type == 3)
        return 'Beast';
    if (unit.type == 4)
        return 'Monster';
    if (unit.type == 5)
        return 'War Machine';
    if (unit.type == 6)
        return 'Manifestation';
    if (unit.type == 7)
        return 'Faction Terrain';
    return 'Regiment of Renown';
}

const upgradeTypeToStr = (unit) => {
    if (unit.type === 0)
        return 'Artefact';
    if (unit.type == 1)
        return 'Heroic Trait';
    if (unit.type == 2)
        return 'Battle Formation';
    if (unit.type == 3)
        return 'Spell Lore';
    if (unit.type == 6)
        return 'Prayer Lore';
    if (unit.type == 4)
        return 'Manifestation Lore';
    if (unit.type == 8)
        return 'Monstrous Trait';
    return 'Unknown';
}

// Standard method of making the name text
const makeSelectableItemType = (typedObj, isUnit=true) => {
    const roleEle = document.createElement('span');
    roleEle.className = 'selectable-item-type ability-label';
    roleEle.style.display = 'inline-block';
    if (isUnit)
        roleEle.textContent = unitTypeToString(typedObj);
    else
        roleEle.textContent = upgradeTypeToStr(typedObj);
    roleEle.style.marginTop = '.5em';
    roleEle.style.marginRight = '1em';
    return roleEle;
}

// Standard method of making the name text
const makeSelectableItemName = (namedObj) => {
    const nameEle = document.createElement('h4');
    nameEle.className = 'selectable-item-name';
    nameEle.textContent = namedObj.name;
    nameEle.style.padding = '0px';
    nameEle.style.margin = '0px';
    return nameEle;
}
