import UpgradeInterf from "./UpgradeInterface.js";

export default interface LoreInterf {
    name: string;
    id: string;
    type: number;
    points: number;
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