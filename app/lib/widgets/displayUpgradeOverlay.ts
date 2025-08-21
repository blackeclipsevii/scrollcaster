import { Overlay } from "./overlay";
import { getVar } from "@/lib/functions/getVar";
import { AbilityWidget } from "./AbilityWidget";
import UpgradeInterf, { UpgradeType } from "@/shared-lib/UpgradeInterface";
import { Force } from "@/shared-lib/Force";
import LoreInterf from "@/shared-lib/LoreInterface";

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

export const displayUpgradeOverlay = Overlay.toggleFactory('block', (u: unknown) =>{
    _initAbSection();
    const upgrade = u as UpgradeInterf;

    if (upgrade.type === UpgradeType.SpellLore ||
        upgrade.type === UpgradeType.PrayerLore ||
        upgrade.type === UpgradeType.ManifestationLore) {
        AbilityWidget.display((upgrade as unknown as LoreInterf).abilities, upgrade.name);
    } else {
        AbilityWidget.display(upgrade, upgrade.name);
    }
});

export const displayRorOverlay = Overlay.toggleFactory('block', (f: unknown) =>{
    const regimentOfRenown = f as Force;
    _initAbSection();
    AbilityWidget.display(regimentOfRenown.upgrades, regimentOfRenown.name);
});