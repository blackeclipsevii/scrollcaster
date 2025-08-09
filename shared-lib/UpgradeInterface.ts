import AbilityInterf from "./AbilityInterface.js";

export enum UpgradeType {
    // Artifact = 0,
    // HeroicTrait = 1,
    BattleFormation = 2,
    SpellLore = 3,
    ManifestationLore = 4,
    BattleTrait = 5,
    PrayerLore = 6,
    RegimentOfRenown = 7,
    // MonstrousTraits = 8,
    Enhancement = 9,
    Unknown = 99
}

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

export default interface UpgradeInterf {
    name: string;
    id: string;
    type: number;
    typeName: string;
    abilities: AbilityInterf[];
    points: number;
}

export interface UpgradeLUT {
    [name: string]: UpgradeInterf;
}
