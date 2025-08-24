import RosterStateConverter, { UnitPool } from "@scrollcaster/shared-lib/RosterStateConverter";
import { ArmyUpgrades } from "@scrollcaster/shared-lib/ArmyUpgrades";
import BattleTacticCardInterf from "@scrollcaster/shared-lib/BattleTacticCardInterf";
import { Force } from "@scrollcaster/shared-lib/Force";
import { getNewRoster } from "@/lib/RestAPI/roster";
import RosterInterf from "@scrollcaster/shared-lib/RosterInterface";
import { getGlobalCache } from "@/lib/RestAPI/LocalCache";

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