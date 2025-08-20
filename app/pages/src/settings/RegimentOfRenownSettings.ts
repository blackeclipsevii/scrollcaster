
import { Force } from "../../../shared-lib/Force.js";
import Settings from "./Settings.js";

export default class RegimentOfRenownSettings implements Settings{
    [name: string] : unknown;
    ror = null as Force | null;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'RegimentOfRenown';
    }
    toUrl() {
        if (this.ror)
            return encodeURI(`${window.location.origin}?page=${this.pageName()}&ror=${this.ror.id}`);
        return window.location.origin;
    }
};
