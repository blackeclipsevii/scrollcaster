import { Overlay } from "./overlay.js";
import { getVar } from "../functions/getVar.js";
import { AbilityWidget } from "./AbilityWidget.js";
import UpgradeInterf from "../../../shared-lib/UpgradeInterface.js";
import { Force } from "../../../shared-lib/Force.js";

const _initAbSection = () => {
    let section = document.getElementById('abilities-section');
    if (!section) {
        section = document.createElement('div');
        section.id = 'abilities-section';
        section.className = 'section';

        // fill the modal window
        section.style.border = `2px solid ${getVar('hover-color')}`;
        section.style.margin = '0px';

        const modal = document.querySelector('.modal') as HTMLElement | null;
        if (modal) {
            modal.style.padding = '0';
            modal.appendChild(section);
        }
    }
}

export const displayUpgradeOverlay = Overlay.toggleFactory('block', (upgrade: UpgradeInterf) =>{
    _initAbSection();

    if (upgrade.type === 3 || upgrade.type === 4 || upgrade.type === 6) {
        AbilityWidget.display(upgrade.abilities, upgrade.name);
    } else {
        AbilityWidget.display(upgrade, upgrade.name);
    }
});

export const displayRorOverlay = Overlay.toggleFactory('block', (regimentOfRenown: Force) =>{
    _initAbSection();
    AbilityWidget.display(regimentOfRenown.upgrades, regimentOfRenown.name);
});