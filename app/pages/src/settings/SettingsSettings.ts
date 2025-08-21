import Settings from "./Settings";
export default class SettingsSettings implements Settings{
    [name: string]: unknown;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Settings';
    }
    toUrl() {
        return encodeURI(`${window.location.origin}?page=${this.pageName()}`);
    }
};
