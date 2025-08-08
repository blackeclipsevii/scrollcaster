async function getVersion (of=null){
    let url = `${endpoint}/version`;
    if (of !== null) 
        url =`${url}?of=${of}`;

    return await fetchWithLoadingDisplay(encodeURI(url), null);
}

const version = (()=>{
  return {
    _server: null,
    _bsdata: null,
    _profiles: null,
    _client: _clientVersion,
    async getClientVersion() {
        return this._client;
    },
    async getServerVersion() {
        if (!this._server){
            const result = await getVersion();
            if (!result)
                return 'unknown';
            this._server = `${result.major}.${result.minor}.${result.patch}`
        }
        return this._server;
    },
    async getBsDataVersion() {
        if (!this._bsdata) {
            const result = await getVersion('bsdata');
            if (!result)
                return 'unknown';
            this._bsdata = result.version.substring(0, 7);
        }
        return this._bsdata;
    },
    async getBattleProfileVersion() {
        if (!this._profiles){
            const result = await getVersion('battle profiles');
            if (!result)
                return 'unknown';
            this._profiles = result.version;
        }
        return this._profiles;
    },
    async stampVersion(roster) {
        if (!roster.meta)
            roster.meta = {};
        roster.meta.clientVersion = await this.getClientVersion();
        roster.meta.bsdataVersion = await this.getBsDataVersion();
        roster.meta.serverVersion = await this.getServerVersion();
        roster.meta.profileVersion = await this.getBattleProfileVersion();
    },
    async isOutdated(roster) {
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