import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay"
import { getEndpoint } from "@/lib/endpoint";
import { ArmyUpgrades } from "@/shared-lib/ArmyUpgrades";

export const fetchUpgrades = async (armyName: string): Promise<ArmyUpgrades | null>=> {
    return await fetchWithLoadingDisplay(encodeURI(`${getEndpoint()}/upgrades?army=${armyName}`));
};