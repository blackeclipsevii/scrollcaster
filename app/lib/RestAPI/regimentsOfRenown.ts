import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js";
import { endpoint } from "../endpoint.js";

export const fetchRegimentsOfRenown = async (armyName: string) => {
    const url = `${endpoint}/regimentsOfRenown?army=${armyName}`;
    return await fetchWithLoadingDisplay(encodeURI(url));
};