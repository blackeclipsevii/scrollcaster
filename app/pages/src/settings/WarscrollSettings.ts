
import Settings from "./Settings.js";
import UnitInterf from "../../../shared-lib/UnitInterface.js";

export default class WarscrollSettings implements Settings {
    [name: string]: unknown;
    unit = null as UnitInterf | null;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Warscroll';
    }

    toUrl() {
        let url = `${window.location.origin}?page=${this.pageName()}`;
        if (this.unit)
            url += `&uniti=${this.unit.id}`;
        return encodeURI(url);
    }
};