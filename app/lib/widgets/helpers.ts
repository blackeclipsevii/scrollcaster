import { Typed } from "../../shared-lib/BasicObject.js";
import { LoreSuperType, loreTypeToString } from "../../shared-lib/LoreInterface.js";
import { otherTypesToString } from "../../shared-lib/OtherTypes.js";
import UnitInterf, { UnitSuperType, unitTypeToString } from "../../shared-lib/UnitInterface.js";
import { UpgradeSuperType, upgradeTypeToString } from "../../shared-lib/UpgradeInterface.js";

export const whClearDiv = (qualifier: string, parent?: HTMLElement | Document) => {
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

export const makeSelectableItemType = (typedObj: string | {typeName?:string} | Typed) => {
    const roleEle = document.createElement('span');
    roleEle.className = 'selectable-item-type ability-label';
    roleEle.style.display = 'inline-block';
    if (typeof typedObj === 'string')
        roleEle.textContent = typedObj;
    else if ((typedObj as {typeName:string}).typeName)
        roleEle.textContent = (typedObj as {typeName:string}).typeName
    else if ((typedObj as Typed).superType) {
        const to = typedObj as Typed;
        if (to.superType === UnitSuperType) {
            roleEle.textContent = unitTypeToString(typedObj as unknown as UnitInterf);
        } else if (to.superType === UpgradeSuperType) {
            roleEle.textContent = upgradeTypeToString(to.type);
        }  else if (to.superType === LoreSuperType) {
            roleEle.textContent = loreTypeToString(to.type);
        }
        else {
            roleEle.textContent = otherTypesToString(to.type);
        }
    }
        
    return roleEle;
}

export const makeSelectableItemName = (namedObj: {name: string} | string) => {
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

export const makeSelectableItem = (displayableObj: {name: string, type?: number, armyName?: string}, isUnit: boolean, parentList: HTMLElement, onclick: (this: HTMLDivElement, ev: MouseEvent) => any) => {
    const section = parentList.closest('.section') as HTMLElement | null;
    if (!section)
        return null;
    section.style.display = 'block';

    const item = document.createElement('div');
    item.classList.add('selectable-item');
    item.addEventListener('click', onclick);

    const left = document.createElement('div');
    left.classList.add('selectable-item-left');

    const nameEle = makeSelectableItemName(displayableObj);
    left.appendChild(nameEle);

    let roleEle: HTMLElement;
    if (displayableObj.type)
        roleEle = makeSelectableItemType(displayableObj as {type:number, typeName?:string});
    else
        roleEle = makeSelectableItemType('Unknown');
    left.appendChild(roleEle);

    if (displayableObj.armyName) {
        const armyName = makeSelectableItemType(displayableObj.armyName);
        left.appendChild(armyName);
    }

    const right = document.createElement('div');
    right.classList.add('selectable-item-right');

    item.append(left, right);
    parentList.appendChild(item);
    
    return item;
};
