import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js"
import { endpoint } from "../endpoint.js";
import BattleTacticCardInterf from "../../shared-lib/BattleTacticCardInterf.js";

export const fetchTactics = async (): Promise<null | BattleTacticCardInterf[]> => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/tactics`));
};