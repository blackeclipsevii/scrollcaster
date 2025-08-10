import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js";
import { endpoint } from "../endpoint.js";
import { SearchableObject } from "../../shared-lib/SearchableObject.js";

export const fetchSearch = async (query: string): Promise<SearchableObject[] | null> => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/search?query=${query}`));
};