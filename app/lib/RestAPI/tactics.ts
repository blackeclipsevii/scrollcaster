import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay"
import { endpoint } from "@/lib/endpoint";
import BattleTacticCardInterf from "@/shared-lib/BattleTacticCardInterf";

export const fetchTactics = async (): Promise<null | BattleTacticCardInterf[]> => {
    return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/tactics`));
};