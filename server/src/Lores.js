import parseCatalog from "./lib/parseCatalog.js";

import Upgrade from "./Upgrade.js";
import { UpgradeType } from "./types/UpgradeType.js";

export class Lore {
    constructor(selectionEntryGroup) {
        this.id = selectionEntryGroup['@id'];
        this.name = selectionEntryGroup['@name'];
        this.abilities = [];
        this.unitIds = [];
        this.type = UpgradeType.SpellLore;
        if (selectionEntryGroup.selectionEntries) {
            selectionEntryGroup.selectionEntries.forEach(selectionEntry => {
                const typename = selectionEntry.profiles[0]['@typeName'].toLowerCase();
                let type = UpgradeType.SpellLore;
                if (typename.includes('prayer'))
                    type = UpgradeType.PrayerLore;
                else if (selectionEntry['@name'].includes('Summon'))
                    type = UpgradeType.ManifestationLore;
                const upgrade = new Upgrade(selectionEntry, type);
                this.abilities.push(upgrade);
            });
            this.type = this.abilities[0].type;
        }

        // assicated the manifestations with the lore
        if (selectionEntryGroup.entryLinks) {
            selectionEntryGroup.entryLinks.forEach(link => {
                this.unitIds.push(link['@targetId']);
            });
        }
    }
}

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

        this.catalogue.sharedSelectionEntryGroups.forEach(group => {
            if (group['@name'] === 'Manifestation Lores') {
                this._doUniversalLores(group);
                return;
            }

            const lore = new Lore(group);

            let typeText = 'spell';
            if (lore.type === UpgradeType.ManifestationLore)
                typeText = 'manifestation';
            else if (lore.type === UpgradeType.PrayerLore)
                typeText = 'prayer';

            this.lores[typeText][lore.id] = lore;
        });
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