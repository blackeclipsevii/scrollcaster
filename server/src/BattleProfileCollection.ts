import BattleProfile from "../shared-lib/BattleProfile.js";

export default class BattleProfileCollection {
    _collection: {
        [name:string]: {[name:string]: Partial<BattleProfile> | null} | null;
    };
    constructor() {
        this._collection = {};
    }
    _modName(name: string) {
        return name.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '');
    }
    put(army: string, profile: BattleProfile) {
        const lc = army.toLowerCase();
        let armyset = this._collection[lc];
        if (!armyset) {
            armyset = {};
            this._collection[lc] = armyset;
        }
        armyset[this._modName(profile.name)] = profile;
    }
    getPartial(army: string, name: string): Partial < BattleProfile > | null {
        const lc = army.toLowerCase();
        const armyset = this._collection[lc];
        if (!armyset)
            return null;
        return armyset[this._modName(name)] as BattleProfile;
    }
    get(army: string, name: string): BattleProfile | null {
        return this.getPartial(army, name) as BattleProfile | null;
    }
    hasProfilesFor(army: string) {
        const lc = army.toLowerCase();
        const armyset = this._collection[lc];
        return armyset ? true : false;
    }
}
