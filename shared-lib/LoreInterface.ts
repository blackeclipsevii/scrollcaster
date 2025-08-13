import { BasicObject } from "./BasicObject.js";
import UpgradeInterf, { UpgradeType } from "./UpgradeInterface.js";

export const LoreSuperType = 'Lore';

export enum LoreType {
    SpellLore = UpgradeType.SpellLore,
    PrayerLore = UpgradeType.PrayerLore,
    ManifestationLore = UpgradeType.ManifestationLore
}

export const loreTypeToString = (type: LoreType) => {
    switch(type)
    {
        case LoreType.SpellLore:
            return "Spell Lore";
        case LoreType.PrayerLore:
            return "Prayer Lore";
        case LoreType.ManifestationLore:
            return "Manifestation Lore";
        default:
            return "Unknown";
    }
}

export default interface LoreInterf extends BasicObject {
    unitIds: string[];
    abilities: UpgradeInterf [];   
}

export interface LoreSlotsInterf {
    manifestation: LoreInterf | null;
    canHaveManifestation: boolean;
    spell: LoreInterf | null;
    canHaveSpell: boolean;
    prayer: LoreInterf | null;
    canHavePrayer: boolean;
}

export interface LoreLUTInterf {
    [key: string]: LoreInterf;
}