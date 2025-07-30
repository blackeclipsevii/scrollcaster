const _initWeaponsSection = (qualifier, parent) => {
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

const displayWeaponOverlay = overlayToggleFactory('flex', (weaponsObj) =>{
    
    const weapons = weaponsObj.weapons;
    const name = weaponsObj.name;
    
    const hasMelee = !weapons.every(weapon => {
        return weapon.type === 1;
    });
    const hasRanged = !weapons.every(weapon => {
        return weapon.type === 0;
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
        const modal = document.querySelector('.modal');
        modal.style.padding = '0';
        modal.append(parentSection);
    }

    widgetWeaponsDisplayWeapons(weapons);
});