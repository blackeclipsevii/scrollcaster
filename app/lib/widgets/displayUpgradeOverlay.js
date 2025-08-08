const _initAbSection = () => {
    let section = document.getElementById('abilities-section');
    if (!section) {
        section = document.createElement('div');
        section.id = 'abilities-section';
        section.className = 'section';

        // fill the modal window
        section.style.border = `2px solid ${getVar('hover-color')}`;
        section.style.margin = '0px';

        const modal = document.querySelector('.modal');
        modal.style.padding = '0';
        modal.appendChild(section);
    }
}

const displayUpgradeOverlay = Overlay.toggleFactory('block', (upgrade) =>{
    _initAbSection();

    if (upgrade.type === 3 || upgrade.type === 4 || upgrade.type === 6) {
        AbilityWidget.display(upgrade.abilities, upgrade.name);
    } else {
        AbilityWidget.display(upgrade, upgrade.name);
    }
});

const displayRorOverlay = Overlay.toggleFactory('block', (regimentOfRenown) =>{
    _initAbSection();
    AbilityWidget.display(regimentOfRenown.upgrades, regimentOfRenown.name);
});