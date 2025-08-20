import Settings from "./Settings.js";
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
