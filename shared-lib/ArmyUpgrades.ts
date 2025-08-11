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

export interface ArmyLores {
    [name:string]: LoreLUTInterf;
    manifestation: LoreLUTInterf;
    spell: LoreLUTInterf;
    prayer: LoreLUTInterf;
}

export interface ArmyUpgrades {
    [name:string]: UpgradeLUT | ArmyLores | Enhancements;
    battleFormations: UpgradeLUT;
    battleTraits: UpgradeLUT;
    lores: ArmyLores
    enhancements: Enhancements;
}