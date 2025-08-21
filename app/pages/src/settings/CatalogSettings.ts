import Settings from "./Settings";
export default class CatalogSettings implements Settings{
    [name: string]: unknown;
    armyName = null as string | null;
    core = false;
    _doSub = true; // this is not intended for external use, just tracking history
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Catalog';
    }
    toUrl() {
        let url: string;
        if (this.armyName)
            url = `${window.location.origin}?page=${this.pageName()}&armyName=${this.armyName}`;
        else
            url = `${window.location.origin}?page=${this.pageName()}`;

        if (this.core)
            url += '&core=true';
        if (!this._doSub)
            url += '&_doSub=false';

        return encodeURI(url);
    }
};
