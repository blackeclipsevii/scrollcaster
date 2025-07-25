
import { Identifiable } from "./Identifiable.js";

export enum UpgradeType {
    Artifact = 0,
    HeroicTrait = 1,
    BattleFormation = 2,
    SpellLore = 3,
    ManifestationLore = 4,
    BattleTraits = 5,
    PrayerLore = 6,
    RegimentOfRenown = 7,
    MonstrousTraits = 8
}

export interface Upgrade extends Identifiable {
    type: UpgradeType
}