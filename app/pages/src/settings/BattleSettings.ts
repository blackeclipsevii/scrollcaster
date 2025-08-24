import RosterInterf from "@scrollcaster/shared-lib/RosterInterface";
import Settings from "./Settings";

export default class BattleSettings implements Settings {
    [name: string]: unknown;
    roster = null as RosterInterf | null;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Battle';
    }
    toUrl() {
        if (this.roster)
            return encodeURI(`${window.location.origin}?page=${this.pageName()}&roster=${this.roster.id}`);
        return window.location.origin;
    }
};
