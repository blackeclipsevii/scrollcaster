import parseCatalog from "./lib/parseCatalog.js";

import Upgrade from "./Upgrade.js";
import { BsLibrary, BsSelectionEntryGroup } from "./lib/bs/BsCatalog.js";
import { UpgradeType } from "@scrollcaster/shared-lib/UpgradeInterface.js";

import LoreInterf, {LoreLUTInterf, LoreSuperType, LoreType} from "@scrollcaster/shared-lib/LoreInterface.js";

export class Lore implements LoreInterf {
    name: string;
    id: string;
    type: number;
    superType: string;
    points: number;
    unitIds: string[];
    abilities: Upgrade[];
    
    constructor(selectionEntryGroup: BsSelectionEntryGroup) {
        this.id = selectionEntryGroup['@id'];
        this.name = selectionEntryGroup['@name'];
        this.superType = LoreSuperType;
        this.abilities = [];
        this.unitIds = [];
        this.type = LoreType.SpellLore;
        this.points = 0;
        if (selectionEntryGroup.selectionEntries) {
            selectionEntryGroup.selectionEntries.forEach(selectionEntry => {
                if (selectionEntry.profiles === undefined)
                    return;
                
                const typename = selectionEntry.profiles[0]['@typeName'].toLowerCase();
                let type = UpgradeType.SpellLore;
                if (selectionEntry['@name'].includes('Summon')) {
                    type = UpgradeType.ManifestationLore;
                } else if (typename.includes('prayer')) {
                    type = UpgradeType.PrayerLore;
                }
                const upgrade = new Upgrade(selectionEntry, type, null);
                this.abilities.push(upgrade);
            });
        
            switch(this.abilities[0].type) {
                case UpgradeType.SpellLore:
                    this.type = LoreType.SpellLore;
                    break;
                case UpgradeType.PrayerLore:
                    this.type = LoreType.PrayerLore;
                    break;
                case UpgradeType.ManifestationLore:
                    this.type = LoreType.ManifestationLore;
                    break;
            }
        }

        // assicated the manifestations with the lore
        if (selectionEntryGroup.entryLinks) {
            selectionEntryGroup.entryLinks.forEach(link => {
                this.unitIds.push(link['@targetId']);
            });
        }
    }
}

export class LoreLUT {
    [name: string]: LoreLUTInterf;
    spell: LoreLUTInterf;
    prayer: LoreLUTInterf;
    manifestation: LoreLUTInterf;
    constructor() {
        this.spell = {};
        this.prayer = {};
        this.manifestation = {};
    }
}

export class UniversalLoreLU {
    id: string;
    points: number;
    type: number;
    constructor() {
        this.id = '';
        this.points = 0;
        this.type = UpgradeType.ManifestationLore;
    }
}

export default class Lores {
    catalogue: BsLibrary;
    lores: LoreLUT;
    universal: UniversalLoreLU[];
    constructor(dir: string) {
        this.universal = [];
        this.lores = new LoreLUT;
        
        const _cat = parseCatalog(`${dir}/Lores.cat`) as BsLibrary | null;
        if (!_cat)
            throw new Error(`Unable to parse ${dir}/Lores.cat`);
        this.catalogue = _cat;

        this.catalogue.sharedSelectionEntryGroups.forEach(group => {
            if (group['@name'] === 'Manifestation Lores') {
                this._doUniversalLores(group);
                return;
            }

            const lore = new Lore(group);
            if (lore.type as UpgradeType === UpgradeType.ManifestationLore)
                this.lores.manifestation[lore.id] = lore;
            else if (lore.type as UpgradeType === UpgradeType.PrayerLore)
                this.lores.prayer[lore.id] = lore;
            else
                this.lores.spell[lore.id] = lore;
        });
    }

    _doUniversalLores(group: BsSelectionEntryGroup) {
        if (!group.selectionEntries)
            return;
        
        group.selectionEntries.forEach(entry => {
            const lu = new UniversalLoreLU;
            if (entry.entryLinks)
                entry.entryLinks.forEach(link => lu.id = link['@targetId']);

            if (entry.costs) {
                entry.costs.forEach(cost => {
                    if (cost['@name'] === 'pts')
                        lu.points = Number(cost['@value']);
                });
            }
            this.universal.push(lu);
        });
    }
}