import { UpgradeLUT } from "./UpgradeInterface.js";
import { LoreLUTInterf } from "./LoreInterface.js";

export interface EnhancementGroup {
    name: string;
    id: string;
    upgrades: UpgradeLUT;
}

export interface Enhancements {
    [name: string]: EnhancementGroup | null;
}

export interface ArmyUpgrades {
    [name:string]: UpgradeLUT | null | unknown;
    battleFormations: UpgradeLUT;
    battleTraits: UpgradeLUT;
    lores: {
        [name:string]: LoreLUTInterf;
        manifestation: LoreLUTInterf;
        spell: LoreLUTInterf;
        prayer: LoreLUTInterf;
    };

    enhancements: Enhancements;
}