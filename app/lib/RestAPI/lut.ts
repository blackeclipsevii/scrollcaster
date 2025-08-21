import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay"
import { endpoint } from "@/lib/endpoint";

export const fetchLUT = async (armyName: string, id: string): Promise<unknown> => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/lut?army=${armyName}&id=${id}`));
};