import RosterStateConverter, { UnitPool } from "../../../shared-lib/RosterStateConverter.js";
import { ArmyUpgrades } from "../../../shared-lib/ArmyUpgrades.js";
import BattleTacticCardInterf from "../../../shared-lib/BattleTacticCardInterf.js";
import { Force } from "../../../shared-lib/Force.js";
import { getNewRoster } from "../../RestAPI/roster.js";
import RosterInterf from "../../../shared-lib/RosterInterface.js";
import { getGlobalCache } from "../../RestAPI/LocalCache.js";

export default class RosterStateConverterImpl extends RosterStateConverter {
    constructor() {
        super();
    }

    async getUnitPool(armyName: string): Promise<UnitPool | null> {
        return await getGlobalCache()?.getUnits(armyName) as UnitPool | null;
    }
    
    async getUpgradePool(armyName: string): Promise<ArmyUpgrades | null> {
        return await getGlobalCache()?.getUpgrades(armyName) as ArmyUpgrades | null;
    }

    async getNewRoster(armyName: string): Promise<RosterInterf | null> {
        return await getNewRoster(armyName) as RosterInterf | null;
    }

    async getTactics(): Promise<BattleTacticCardInterf[] | null> {
        return await getGlobalCache()?.getTactics() as BattleTacticCardInterf[] | null
    }

    async getRegimentsOfRenown(armyName: string): Promise<Force[] | null> {
        return await getGlobalCache()?.getRegimentsOfRenown(armyName) as Force[] | null
    }
};