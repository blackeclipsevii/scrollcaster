import ModelInterf from './ModelInterface.js'
import AbilityInterf from './AbilityInterface.js';
import UpgradeInterf from './UpgradeInterface.js';
import OptionSet from './Options.js';
import BattleProfile from './BattleProfile.js';

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

export default interface UnitInterf {
    name: string;
    id: string;

    isWarmaster: boolean;
    
    canBeGeneral: boolean;
    isGeneral: boolean;

    canBeReinforced: boolean;
    isReinforced: boolean;

    points: number;
    type: number;

    models: ModelInterf[];

    enhancements: {[name: string]: EnhancementSlotInterf};
    abilities: AbilityInterf[];
    keywords: string[];
    optionSets: OptionSet[];
    battleProfile: BattleProfile | null;
    _tags: string[];
}