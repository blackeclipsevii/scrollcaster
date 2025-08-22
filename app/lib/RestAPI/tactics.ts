import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay"
import { getEndpoint } from "@/lib/endpoint";
import BattleTacticCardInterf from "@/shared-lib/BattleTacticCardInterf";

export const fetchTactics = async (): Promise<null | BattleTacticCardInterf[]> => {
    return await fetchWithLoadingDisplay(encodeURI(`${getEndpoint()}/tactics`));
};