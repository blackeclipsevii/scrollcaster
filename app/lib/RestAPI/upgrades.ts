import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay"
import { endpoint } from "@/lib/endpoint";
import { ArmyUpgrades } from "@/shared-lib/ArmyUpgrades";

export const fetchUpgrades = async (armyName: string): Promise<ArmyUpgrades | null>=> {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/upgrades?army=${armyName}`));
};