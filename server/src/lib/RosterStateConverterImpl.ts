
import { ArmyUpgrades } from "../../shared-lib/ArmyUpgrades.js";
import BattleTacticCardInterf from "../../shared-lib/BattleTacticCardInterf.js";
import { Force } from "../../shared-lib/Force.js";
import RosterInterf from "../../shared-lib/RosterInterface.js";
import RosterStateConverter, { UnitPool } from "../../shared-lib/RosterStateConverter.js";
import AgeOfSigmar from "../AgeOfSigmar.js";
import Army from "../Army.js";
import Roster from "../Roster.js";

export default class RosterStateConverterImpl extends RosterStateConverter {
    ageOfSigmar: AgeOfSigmar
    army: Army | null;

    constructor(ageOfSigmar: AgeOfSigmar) {
        super();
        this.ageOfSigmar = ageOfSigmar;
        this.army = null;
    }

    _getArmy(armyName: string) {
        if (this.army)
            return this.army;
        const army = this.ageOfSigmar.getArmy(armyName);
        this.army = army;
        return army;
    }

    async getUnitPool(armyName: string): Promise<UnitPool | null> {
        const army = this._getArmy(armyName);
        if (!army)
            return null
        return army.units;
    }
    
    async getUpgradePool(armyName: string): Promise<ArmyUpgrades | null> {
        const army = this._getArmy(armyName);
        if (!army)
            return null
        return army.upgrades;
    }

    async getNewRoster(armyName: string): Promise<RosterInterf | null> {
        const army = this._getArmy(armyName);
        if (!army)
            return null
        return new Roster(army);
    }

    async getTactics(): Promise<BattleTacticCardInterf[] | null> {
        return this.ageOfSigmar.battleTacticCards;
    }

    async getRegimentsOfRenown(armyName: string): Promise<Force[] | null> {
        const army = this._getArmy(armyName);
        if (!army)
            return null
        return army.regimentsOfRenown;
    }
};