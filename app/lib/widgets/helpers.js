
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