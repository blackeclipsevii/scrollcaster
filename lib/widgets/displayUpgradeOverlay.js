const displayUpgradeOverlay = overlayToggleFactory('block', (upgrade) =>{
    const modal = document.querySelector(".modal");
    modal.innerHTML = '';
    
    let section = document.getElementById('abilities-section');
    if (!section) {
        section = document.createElement('div');
        section.id = 'abilities-section';
        section.className = 'section';
        modal.appendChild(section);
    }

    if (upgrade.type === 3 || upgrade.type === 4 || upgrade.type === 6) {
        widgetAbilityDisplayAbilities(upgrade.abilities, modal);
    } else {
        widgetAbilityDisplayAbilities(upgrade, modal);
    }

    const offset = (window.innerWidth - modal.clientWidth- getScrollbarWidth()) / 2.0;
    modal.style.marginLeft = `${offset}px`; 
});