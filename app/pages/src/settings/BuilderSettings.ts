import RosterInterf from "../../../shared-lib/RosterInterface.js";
import Settings from "./Settings.js";

export default class BuilderSettings implements Settings{
    [name: string]: unknown;
    roster: RosterInterf;
    constructor(roster: RosterInterf) {
        this.roster = roster;
    }
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Builder';
    }
    toUrl() {
        if (this.roster)
            return encodeURI(`${window.location.origin}?page=${this.pageName()}&roster=${this.roster.id}`);
        return window.location.origin;
    }
};