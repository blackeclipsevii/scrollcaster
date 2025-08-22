import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay";
import { getEndpoint } from "@/lib/endpoint";
import { SearchableObject } from "@/shared-lib/SearchableObject";

export const fetchSearch = async (query: string): Promise<SearchableObject[] | null> => {
    return await fetchWithLoadingDisplay(encodeURI(`${getEndpoint()}/search?query=${query}`));
};