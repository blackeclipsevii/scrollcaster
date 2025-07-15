const displayUpgradeOverlay = (upgrade) => {
    const overlay = document.getElementById("overlay");
    const visibleStyle = 'block';
    if (overlay.style.display === visibleStyle) {
        overlay.style.display = "none";
    } else {
        overlay.style.display = visibleStyle;
        const modal = document.querySelector(".modal");
        modal.innerHTML = '';
        
        let section = document.getElementById('abilities-section');
        if (!section) {
            section = document.createElement('div');
            section.id = 'abilities-section';
            section.className = 'section';
            modal.appendChild(section);
        }

        if (upgrade.spells) {
            widgetAbilityDisplayAbilities(upgrade.spells, modal);
        } else {
            widgetAbilityDisplayAbilities(upgrade, modal);
        }

        const offset = (window.innerWidth - modal.clientWidth- getScrollbarWidth()) / 2.0;
        modal.style.marginLeft = `${offset}px`;                 }
};