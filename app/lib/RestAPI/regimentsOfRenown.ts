import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js";
import { endpoint } from "../endpoint.js";
import { Force } from "../../shared-lib/Force.js";

export const fetchRegimentsOfRenown = async (armyName: string): Promise<Force[] | null> => {
    const url = `${endpoint}/regimentsOfRenown?army=${armyName}`;
    return await fetchWithLoadingDisplay(encodeURI(url));
};