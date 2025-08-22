import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay";
import { getEndpoint } from "@/lib/endpoint";
import { Force } from "@/shared-lib/Force";

export const fetchRegimentsOfRenown = async (armyName ?: string): Promise<Force[] | null> => {
    let url = `${getEndpoint()}/regimentsOfRenown`;
    if (armyName)
        url += `?army=${armyName}`;
    return await fetchWithLoadingDisplay(encodeURI(url));
};