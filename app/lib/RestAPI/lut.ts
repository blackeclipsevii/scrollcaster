import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js"
import { endpoint } from "../endpoint.js";

export const fetchLUT = async (armyName: string, id: string): Promise<unknown> => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/lut?army=${armyName}&id=${id}`));
};