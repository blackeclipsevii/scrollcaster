const unitsApi = {
    _cache: {
        units: null,
        armyName: null,
        leaderId: null
    },
    async get(armyName = null, leaderId = null) {
        if(this._cache.units && 
           this._cache.armyName === armyName &&
           this._cache.leaderId === leaderId)
            return this._cache.units;
        let url = `${endpoint}/units`;
        if (armyName) {
            url = `${url}?army=${armyName}`
            if (leaderId) {
                // to-do move the leader filter client side and use the same cache
                url = `${url}&leaderId=${leaderId}`;
            }
        }
        const result = await fetchWithLoadingDisplay(encodeURI(url));
        if (result){
            this._cache.units = result;
            this._cache.armyName = armyName;
            this._cache.leaderId = leaderId;
        }
        return result;
    }
};