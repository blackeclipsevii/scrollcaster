import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js";
import { endpoint } from "../endpoint.js";

export const fetchSearch = async (query: string) => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/search?query=${query}`));
};