import Settings from "./Settings.js";
export default class SearchSettings implements Settings{
    [name: string]: unknown;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Search';
    }
    toUrl() {
        return encodeURI(`${window.location.origin}?page=${this.pageName()}`);
    }
};
