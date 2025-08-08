
const whClearDiv = (qualifier, parent) => {
    let div = null;
    if (qualifier.startsWith('.')) {
        if (!parent)
            parent = document;
        div = parent.querySelector(qualifier);
    } else {
        div = document.getElementById(qualifier + 'Div');
    }
    
    if (div) {
        div.innerHTML = "";
    }
    return div;
}

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
    if (unit.type == 2)
        return 'Battle Formation';
    if (unit.type == 3)
        return 'Spell Lore';
    if (unit.type == 6)
        return 'Prayer Lore';
    if (unit.type == 4)
        return 'Manifestation Lore';
    if (unit.type == 9) 
        return 'Enhancement';
    return 'Unknown';
}

const makeSelectableItemType = (typedObj, isUnit=true) => {
    const roleEle = document.createElement('span');
    roleEle.className = 'selectable-item-type ability-label';
    roleEle.style.display = 'inline-block';
    if (typeof typedObj === 'string')
        roleEle.textContent = typedObj;
    else if (typedObj.typeName)
        roleEle.textContent = typedObj.typeName
    else if (isUnit)
        roleEle.textContent = unitTypeToString(typedObj);
    else
        roleEle.textContent = upgradeTypeToStr(typedObj);
    return roleEle;
}

const makeSelectableItemName = (namedObj) => {
    let name = namedObj;
    if (typeof namedObj !== 'string')
        name = namedObj.name;
    const nameEle = document.createElement('p');
    nameEle.className = 'selectable-item-name';
    nameEle.textContent = name;
    nameEle.style.padding = '0px';
    nameEle.style.margin = '0px';
    return nameEle;
}