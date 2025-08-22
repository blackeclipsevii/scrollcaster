import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay"
import { getEndpoint } from "@/lib/endpoint";

export const fetchLUT = async (armyName: string, id: string): Promise<unknown> => {
    return await fetchWithLoadingDisplay(encodeURI(`${getEndpoint()}/lut?army=${armyName}&id=${id}`));
};