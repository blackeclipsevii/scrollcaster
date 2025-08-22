import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay"
import { getEndpoint } from "@/lib/endpoint";
import UnitInterf from "@/shared-lib/UnitInterface";

export const unitsApi = {
    _cache: {
        units: null as unknown | null,
        armyName: null as string | null,
        leaderId: null as string | null
    },
    async get(armyName: string | null = null, leaderId: string | null = null): Promise<{[name: string]: UnitInterf} | null> {
        if(this._cache.units && 
           this._cache.armyName === armyName &&
           this._cache.leaderId === leaderId) {
            return this._cache.units as {[name: string]: UnitInterf};
        }
        let url = `${getEndpoint()}/units`;
        if (armyName) {
            url = `${url}?army=${armyName}`
            if (leaderId) {
                // to-do move the leader filter client side and use the same cache
                url = `${url}&leaderId=${leaderId}`;
            }
        }
        const result = await fetchWithLoadingDisplay(encodeURI(url)) as {[name: string]: UnitInterf} | null;
        if (result){
            this._cache.units = result;
            this._cache.armyName = armyName;
            this._cache.leaderId = leaderId;
        }
        return result;
    }
};