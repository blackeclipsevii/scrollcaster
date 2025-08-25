
class AppSettingsInternal {
    [name: string]: boolean;
    'Contextual Filtering': boolean;
    'Battle View Drawers': boolean;
    'Display Legends': boolean;
    constructor() {
        this['Contextual Filtering'] = true;
        this['Battle View Drawers'] = true;
        this['Display Legends'] = false;
    }
}

var _globalSettings: AppSettingsInternal | null = null;

// Singleton settings
export default class AppSettings {
    _key: string;
    constructor() {
        const version = 1;
        this._key =`app-settings-v${version.toString()}`;
        this.load();
    }
    load(force ?: boolean): AppSettingsInternal {
        if (!_globalSettings || force) {
            const savedSettings = localStorage.getItem(this._key);
            if (savedSettings) {
                _globalSettings = JSON.parse(savedSettings) as AppSettingsInternal;
            } else {
                _globalSettings = new AppSettingsInternal;
            }
        }
        return _globalSettings;
    }
    clear() {
        _globalSettings = new AppSettingsInternal;
        this.save();
    }
    save() {
        localStorage.setItem(this._key, JSON.stringify(_globalSettings));
    }
    settings(): AppSettingsInternal {
        if (!_globalSettings)
            return this.load();
        return _globalSettings;
    }
}