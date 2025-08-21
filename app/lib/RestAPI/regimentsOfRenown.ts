import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay";
import { endpoint } from "@/lib/endpoint";
import { Force } from "@/shared-lib/Force";

export const fetchRegimentsOfRenown = async (armyName ?: string): Promise<Force[] | null> => {
    let url = `${endpoint}/regimentsOfRenown`;
    if (armyName)
        url += `?army=${armyName}`;
    return await fetchWithLoadingDisplay(encodeURI(url));
};