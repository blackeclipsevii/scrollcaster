
import Settings from "./Settings";
import UnitInterf from "@scrollcaster/shared-lib/UnitInterface";

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