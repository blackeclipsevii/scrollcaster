import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js"
import { endpoint } from "../endpoint.js";
import { ArmyUpgrades } from "../../shared-lib/ArmyUpgrades.js";

export const fetchUpgrades = async (armyName: string): Promise<ArmyUpgrades | null>=> {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/upgrades?army=${armyName}`));
};