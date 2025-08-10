import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js"
import { endpoint } from "../endpoint.js";

export const fetchTactics = async () => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/tactics`));
};