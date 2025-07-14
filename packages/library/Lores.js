import parseCatalog from "./parseCatalog.js";

import { UpgradeType } from "./Upgrade.js";
import Upgrade from "./Upgrade.js";

export default class Lores {
    constructor(dir) {
        this.universal = [];
        this.lores = {};
        this.catalogue = parseCatalog(`${dir}/Lores.cat`);
        if (!this.catalogue)
            return;

        this.catalogue.sharedSelectionEntryGroups.forEach(lore => {
            const spells = {};
            spells.name = lore['@name'];
            if (spells.name === 'Manifestation Lores') {
                this._doUniversalLores(lore);
                return;
            }
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

    _doUniversalLores(group) {
        group.selectionEntries.forEach(entry => {
            const lu = {
                id: '',
                points: 0,
                type: UpgradeType.ManifestationLore
            };
            entry.entryLinks.forEach(link =>{
                lu.id = link['@targetId'];
            });
            if (entry.costs) {
                entry.costs.forEach(cost => {
                    if (cost['@name'] === 'pts') {
                        lu.points = Number(cost['@value']);
                    }
                });
            }
            this.universal.push(lu);
        });
    }
}