import { fetchWithLoadingDisplay } from "./fetchWithLoadingDisplay.js"
import { endpoint } from "../endpoint.js";
import { _clientVersion } from "../../version.js";

interface VersionParts {
    major: string, minor: string, patch:string
}
interface VersionWhole {
    version:string
}

async function getVersion (of: string | null = null): Promise<VersionParts | VersionWhole | null> {
    let url = `${endpoint}/version`;
    if (of !== null) 
        url =`${url}?of=${of}`;

    return await fetchWithLoadingDisplay(encodeURI(url), null);
}

export const version = (()=>{
  return {
    _server: null as string | null,
    _bsdata: null as string | null,
    _profiles: null as string | null,
    _client: _clientVersion as string,
    async getClientVersion() {
        return this._client;
    },
    async getServerVersion() {
        if (!this._server){
            const result = await getVersion() as VersionParts | null;
            if (!result)
                return 'unknown';

            this._server = `${result.major}.${result.minor}.${result.patch}`
        }
        return this._server;
    },
    async getBsDataVersion() {
        if (!this._bsdata) {
            const result = await getVersion('bsdata') as VersionWhole | null;
            if (!result)
                return 'unknown';
            
            this._bsdata = result.version.substring(0, 7);
        }
        return this._bsdata;
    },
    async getBattleProfileVersion() {
        if (!this._profiles){
            const result = await getVersion('battle profiles') as VersionWhole | null;
            if (!result)
                return 'unknown';
            this._profiles = result.version;
        }
        return this._profiles;
    },
    async stampVersion(roster: {meta: {[name: string]: string} | null}) {
        if (!roster.meta)
            roster.meta = {};
        roster.meta.clientVersion = await this.getClientVersion();
        roster.meta.bsdataVersion = await this.getBsDataVersion();
        roster.meta.serverVersion = await this.getServerVersion();
        roster.meta.profileVersion = await this.getBattleProfileVersion();
    },
    async isOutdated(roster: {meta: {[name: string]: string}}) {
        if (!roster.meta)
            return true;
        if (roster.meta.serverVersion !== await this.getServerVersion())
            return true;
        if (roster.meta.profileVersion !== await this.getBattleProfileVersion())
            return true;
        if (roster.meta.bsdataVersion !== await this.getBsDataVersion())
            return true;
        return false;
    }
  }
})();