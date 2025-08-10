import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js"
import { endpoint } from "../endpoint.js";

export const fetchUpgrades = async (armyName: string) => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/upgrades?army=${armyName}`));
};