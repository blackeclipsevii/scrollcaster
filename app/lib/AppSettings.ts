
class AppSettingsInternal {
    [name: string]: boolean;
    'display-legends': boolean;
    constructor() {
        this['display-legends'] = false
    }
}

var _globalSettings: AppSettingsInternal | null = null;

// Singleton settings
export default class AppSettings {
    _key: string;
    constructor() {
        this._key = 'app-settings';
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