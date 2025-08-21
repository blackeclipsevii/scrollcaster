import Settings from "./Settings";
export default class RostersSettings implements Settings {
  [name: string]: unknown;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Rosters';
    }
    toUrl() {
        return window.location.origin;
    }
};
