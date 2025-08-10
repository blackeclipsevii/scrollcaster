import { BasicObject } from "./BasicObject.js";
import UpgradeInterf from "./UpgradeInterface.js";

export const LoreSuperType = 'Lore';

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