import Settings from "./Settings.js";
import RosterInterf from "../../../shared-lib/RosterInterface.js";

export default class TacticsSettings implements Settings{
    [name: string]: unknown;
    roster = null as RosterInterf | null;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Tactics';
    }
    toUrl() {
        if (this.roster)
            return encodeURI(`${window.location.origin}?page=${this.pageName()}&ror=${this.roster.id}`);
        return encodeURI(`${window.location.origin}?page=${this.pageName()}`);
    }
};
