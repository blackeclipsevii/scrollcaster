import { Overlay } from "./overlay";
import { WeaponWidget } from "./WeaponWidget";
import { getVar } from "@/lib/functions/getVar";
import WeaponInterf, { WeaponType } from "@/shared-lib/WeaponInterf";

const _initWeaponsSection = (qualifier: string, parent: HTMLElement) => {
    let section = document.getElementById(`${qualifier}-weapons-section`);
    if (!section) {
        section = document.createElement('div');
        section.id = `${qualifier}-weapons-section`;
        section.className = 'section';
        section.style.margin = '0px';
        parent.appendChild(section);
        return true;
    }
    return false;
}

export const displayWeaponOverlay = Overlay.toggleFactory('flex', (input: unknown) =>{
    const weaponsObj = input as {name: string, weapons: WeaponInterf[]};
    const weapons = weaponsObj.weapons;
    const name = weaponsObj.name;
    
    const hasMelee = !weapons.every(weapon => {
        return weapon.type === WeaponType.Ranged;
    });
    const hasRanged = !weapons.every(weapon => {
        return weapon.type === WeaponType.Melee;
    });
    const parentSection = document.createElement('div');
    parentSection.style.padding = '0';
    parentSection.style.paddingLeft = '1em';
    parentSection.style.paddingRight = '1em';
    parentSection.style.margin = '0'
    parentSection.style.border = `2px solid ${getVar('hover-color')}`;
    
    const title = document.createElement('h3');
    title.textContent = name;
    parentSection.appendChild(title);

    let useModal = false;
    if (hasRanged)
        useModal =_initWeaponsSection('ranged', parentSection);
    if (hasMelee)
        useModal =_initWeaponsSection('melee', parentSection);
    
    if (useModal) {
        const modal = document.querySelector('.modal') as HTMLElement | null;
        if (modal) {
            modal.style.padding = '0';
            modal.append(parentSection);
        }
    }

    WeaponWidget.display(weapons);
});