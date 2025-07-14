import parseCatalog from "./parseCatalog.js";

import { UpgradeType } from "./Upgrade.js";
import Upgrade from "./Upgrade.js";

export default class Lores {
    constructor(dir) {
        this.lores = {};
        this.catalogue = parseCatalog(`${dir}/Lores.cat`);
        if (!this.catalogue)
            return;

        this.catalogue.sharedSelectionEntryGroups.forEach(lore => {
            const spells = {};
            spells.name = lore['@name'];
            spells.id = lore['@id'];
            spells.spells = [];

            if (lore.selectionEntries) {
                const type = lore['@name'].includes('Manifestation') ? UpgradeType.ManifestationLore : UpgradeType.SpellLore;
                lore.selectionEntries.forEach(selectionEntry => {
                    spells.spells.push(new Upgrade(selectionEntry, type))
                    spells.type = type;
                });
            } 

            if (!spells) {
                console.log (`No profiles found for ${lore['@name']}`);
                console.log (JSON.stringify(lore, null, 2));
            }
            this.lores[lore['@id']] = spells;
        });

       // console.log(JSON.stringify(this.lores, null, 2));
    }
}