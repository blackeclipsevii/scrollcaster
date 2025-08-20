import Settings from "./Settings.js";
import RosterInterf from "../../../shared-lib/RosterInterface.js";

export default class UnitSettings implements Settings {
    [name: string]: unknown;
    type = null as string | null;
    roster = null as  RosterInterf | null;
    regimentIndex = null as number | null;
    auxiliary = false;

    displayLegends = false;
    armyName = null as string | null;

    hasRegimentIndex() {
        return this.regimentIndex !== null;
    }
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Unit';
    }
    toUrl() {
        let url = `${window.location.origin}?page=${this.pageName()}`;
        if (this.type)
            url += `&type=${this.type}`;
        if (this.roster)
            url += `&roster=${this.roster.id}`;
        if (this.regimentIndex !== null)
            url += `&regimentIndex=${this.regimentIndex.toString()}`;
        if (this.auxiliary)
            url += `&auxiliary=true`;
        if (this.armyName)
            url += `&armyName=${this.armyName}`;
        return encodeURI(url);
    }
}