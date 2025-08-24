import Settings from "./Settings";
import RosterInterf from "@scrollcaster/shared-lib/RosterInterface";

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
