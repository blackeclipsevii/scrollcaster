import parseCatalog from "./parseCatalog.js";

import { UpgradeType } from "./Upgrade.js";
import Upgrade from "./Upgrade.js";

export default class Lores {
    constructor(dir) {
        this.universal = [];
        this.lores = {
            spell: {},
            prayer: {},
            manifestation: {}
        };
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
            spells.abilities = [];

            if (lore.selectionEntries) {
                lore.selectionEntries.forEach(selectionEntry => {
                    const typename = selectionEntry.profiles[0]['@typeName'].toLowerCase();
                    let type = UpgradeType.SpellLore;
                    if (typename.includes('prayer'))
                        type = UpgradeType.PrayerLore;
                    else if (selectionEntry['@name'].includes('Summon'))
                        type = UpgradeType.ManifestationLore;
                    const upgrade = new Upgrade(selectionEntry, type);

                    spells.abilities.push(upgrade);
                });
                spells.type = spells.abilities[0].type;
            } 

            if (!spells) {
                console.log (`No profiles found for ${lore['@name']}`);
                console.log (JSON.stringify(lore, null, 2));
            }
            
            let typeText = 'spell';
            if (spells.type === UpgradeType.ManifestationLore)
                typeText = 'manifestation';
            else if (spells.type === UpgradeType.PrayerLore)
                typeText = 'prayer';

            this.lores[typeText][lore['@id']] = spells;
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
            console.log(`added universal lore : ${entry['@name']} ${lu.id}`);
            this.universal.push(lu);
        });
    }
}