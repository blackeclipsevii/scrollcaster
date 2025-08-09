import UnitInterf from "./UnitInterface.js";
import { Force } from "./Force.js";
import UpgradeInterf, {UpgradeLUT} from "./UpgradeInterface.js";
import BattleTacticCardInterf from "./BattleTacticCardInterf.js";
import { LoreSlotsInterf } from "./LoreInterface.js";

export interface RegimentInterf {
    leader: UnitInterf | null,
    units: UnitInterf[]
}

export default interface RosterInterf {
    // roster identifier
    id: string;

    // name of the roster
    name: string;

    // name of the Army this roster is for
    army: string;

    // max points allowed
    points: number;

    // true if army of renown
    isArmyOfRenown: boolean;
    
    // metadata associated with the roster (typically version info)
    meta: {[name: string]: unknown};

    // army battle traits
    battleTraits: UpgradeLUT;
    battleFormation: UpgradeInterf | null;
    battleTacticCards: BattleTacticCardInterf[];

    regiments: RegimentInterf[];
    regimentOfRenown: Force | null;
    auxiliaryUnits: UnitInterf[];
    terrainFeature: UnitInterf | null;
    lores: LoreSlotsInterf;    
}