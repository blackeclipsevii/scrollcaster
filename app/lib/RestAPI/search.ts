import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay";
import { endpoint } from "@/lib/endpoint";
import { SearchableObject } from "@/shared-lib/SearchableObject";

export const fetchSearch = async (query: string): Promise<SearchableObject[] | null> => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/search?query=${query}`));
};