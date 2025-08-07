import Ability from "./Ability.js";

import { BsCost, BsProfile, BsSelectionEntry } from "./lib/bs/BsCatalog.js"
import { UpgradeType } from "./lib/Upgrade.js";

export const upgradeTypeToString = (type: UpgradeType): string => {
    switch(type) {
        case UpgradeType.BattleFormation:
            return 'Battle Formation';
        case UpgradeType.SpellLore:
            return 'Spell Lore';
        case UpgradeType.ManifestationLore:
            return 'Manifestation Lore';
        case UpgradeType.BattleTrait:
            return 'Battle Trait';
        case UpgradeType.PrayerLore:
            return 'Prayer Lore';
        case UpgradeType.RegimentOfRenown:
            return 'Regiment of Renown';
        case UpgradeType.Enhancement:
            return 'Enhancement';
        default:
            return 'Unknown';
    };
}

export default class Upgrade {
    name: string;
    id: string;
    type: number;
    typeName: string;
    abilities: Ability[];
    points: number;
    constructor (selectionEntry: BsSelectionEntry, type: UpgradeType, typeName: string | null) {
        this.name = selectionEntry['@name'];
        this.id = selectionEntry["@id"];
        this.type = type;
        if (typeName)
            this.typeName = typeName;
        else
            this.typeName = upgradeTypeToString(type);

        this.abilities = [];
        if (selectionEntry.profiles) {
            const profiles: BsProfile[] = selectionEntry.profiles;
            profiles.forEach(profile => {
                this.abilities.push(new Ability(profile));
            });
        }
        this.points = 0;
        if (selectionEntry.costs) {
            const costs: BsCost[] = selectionEntry.costs;
            costs.forEach((cost) => {
                if (cost['@name'] === 'pts') {
                    this.points = Number(cost['@value']);
                }
            });
        }
    }
}