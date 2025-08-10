
import { UpgradeLUT } from "../shared-lib/UpgradeInterface.js";
import RosterInterf from "../shared-lib/RosterInterface.js";
import { UnitType } from "../shared-lib/UnitInterface.js";

import Army from "./Army.js";
import Unit from "./Unit.js";
import BattleTacticCard from "./BattleTacticCard.js";
import { Lore, LoreLUT } from "./Lores.js";
import { Force } from "../shared-lib/Force.js";
import Upgrade from "./Upgrade.js";

export class LoreSlots {
    manifestation: Lore | null;
    canHaveManifestation: boolean;
    spell: Lore | null;
    canHaveSpell: boolean;
    prayer: Lore | null;
    canHavePrayer: boolean;
    constructor() {
        this.manifestation = null;
        this.spell = null;
        this.prayer = null;
        this.canHaveManifestation = true;
        this.canHaveSpell = true;
        this.canHavePrayer = true;
    }
}

export interface Regiment {
    leader: Unit | null,
    units: Unit[]
}

export default class Roster implements RosterInterf {
    // roster identifier
    id: string;

    // name of the roster
    name: string;

    // description
    description: string | undefined;

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
    battleFormation: Upgrade | null;
    battleTacticCards: BattleTacticCard[];

    regiments: Regiment[];
    regimentOfRenown: Force | null;
    auxiliaryUnits: Unit[];
    terrainFeature: Unit | null;
    lores: LoreSlots;    
    
    constructor(army: Army) {
        this.meta = {
            version: {
                major: 0,
                minor: 1,
                patch: 0
            }
        };
        this.army = army.name;
        this.battleTraits = army.upgrades.battleTraits;
        
        this.id = "";
        this.name = "";
        this.battleFormation = null;
        this.points = 2000;
        this.regiments = [];
        this.auxiliaryUnits = [];
        this.battleTacticCards = [];
        this.lores = new LoreSlots;
        this.regimentOfRenown = null;
        this.terrainFeature = null;
        this.isArmyOfRenown = army.isArmyOfRenown;
        this._setDefaultValues(army);        
    }

    _setDefaultValues(army: Army) {
        // setup defaults for army
        // MOST armies have one terrain feature, so just find it
        const unitIds = Object.getOwnPropertyNames(army.units);
        unitIds.forEach(id => {
            const unit = (army.units as {[name:string]: Unit})[id];
            if (unit.type === UnitType.Terrain) {
                if (!unit.points || unit.points === 0) {
                    this.terrainFeature = unit;
                }
            }
        });

        const armyLores = ((army.upgrades as {[name:string]:any}).lores as LoreLUT);
        let names = Object.getOwnPropertyNames(army.upgrades.lores.spell);
        if (names.length === 1)
            this.lores.spell = armyLores.spell[names[0]];
        else if (names.length === 0)
            this.lores.canHaveSpell = false;

        names = Object.getOwnPropertyNames(army.upgrades.lores.prayer);
        if (names.length === 1)
            this.lores.prayer = armyLores.prayer[names[0]];
        else if (names.length === 0)
            this.lores.canHavePrayer = false;
    }
}