import UnitInterf, { unitTypeToString } from "../../../shared-lib/UnitInterface.js";
import UpgradeInterf, { UpgradeType } from "../../../shared-lib/UpgradeInterface.js";
import { upgradeTypeToString } from "../../../shared-lib/UpgradeInterface.js";

export const whClearDiv = (qualifier: string, parent: HTMLElement | Document) => {
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

export const makeSelectableItemType = (typedObj: string | {type:number, typeName:string|undefined}, isUnit=true) => {
    const roleEle = document.createElement('span');
    roleEle.className = 'selectable-item-type ability-label';
    roleEle.style.display = 'inline-block';
    if (typeof typedObj === 'string')
        roleEle.textContent = typedObj;
    else if (typedObj.typeName)
        roleEle.textContent = typedObj.typeName
    else if (isUnit)
        roleEle.textContent = unitTypeToString(typedObj as unknown as UnitInterf);
    else
        roleEle.textContent = upgradeTypeToString(typedObj.type);
    return roleEle;
}

export const makeSelectableItemName = (namedObj: {name: string}) => {
    let name: string = '';
    if (typeof namedObj === 'string')
        name = namedObj;
    else
        name = namedObj.name;
    const nameEle = document.createElement('p');
    nameEle.className = 'selectable-item-name';
    nameEle.textContent = name;
    nameEle.style.padding = '0px';
    nameEle.style.margin = '0px';
    return nameEle;
}