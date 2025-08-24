import ModelInterf from './ModelInterface.js'
import AbilityInterf from './AbilityInterface.js';
import UpgradeInterf from './UpgradeInterface.js';
import OptionSet from './Options.js';
import BattleProfile from './BattleProfile.js';
import { BasicObject } from './BasicObject.js';

export const UnitSuperType = "Unit";

export enum UnitType {
    Hero = 0,
    Infantry = 1,
    Cavalry = 2,
    Beast = 3,
    Monster = 4,
    WarMachine = 5,
    Manifestation = 6,
    Terrain = 7,
    Unknown = 99
}

export function strToUnitType(str: string) {
    const upper = str.toUpperCase();
    if (upper === 'FACTION TERRAIN') {
        return UnitType.Terrain;
    } else if (upper === 'MANIFESTATION' || upper === 'ENDLESS SPELL') {
        return UnitType.Manifestation;
    } else if (upper === 'HERO') {
        return UnitType.Hero;
    } else if (upper === 'INFANTRY') {
        return UnitType.Infantry;
    } else if (upper === 'CAVALRY') {
        return UnitType.Cavalry;
    } else if (upper === 'BEAST') {
        return UnitType.Beast;
    } else if (upper === 'MONSTER') {
        return UnitType.Monster;
    } else if (upper === 'WAR MACHINE') {
        return UnitType.WarMachine;
    }
    return UnitType.Unknown;
}

export const unitTypeToString = (unit: UnitInterf) => {
    if (unit.type === 0)
        return 'Hero';
    if (unit.type == 1)
        return 'Infantry';
    if (unit.type == 2)
        return 'Cavalry';
    if (unit.type == 3)
        return 'Beast';
    if (unit.type == 4)
        return 'Monster';
    if (unit.type == 5)
        return 'War Machine';
    if (unit.type == 6)
        return 'Manifestation';
    if (unit.type == 7)
        return 'Faction Terrain';
    return 'Regiment of Renown';
}

export interface EnhancementSlotInterf {
    name: string;
    id: string;
    slot: UpgradeInterf | null;
}

export default interface UnitInterf extends BasicObject {
    Move: string;
    Health: string;
    Control: string;
    Save: string;

    isWarmaster: boolean;
    
    canBeGeneral: boolean;
    isGeneral: boolean;

    canBeReinforced: boolean;
    isReinforced: boolean;

    models: ModelInterf[];

    enhancements: {[name: string]: EnhancementSlotInterf};
    abilities: AbilityInterf[];
    keywords: string[];
    optionSets: OptionSet[];
    battleProfile: BattleProfile | null;
    _tags: string[];
}