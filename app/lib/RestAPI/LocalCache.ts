import { ArmyUpgrades } from "@/shared-lib/ArmyUpgrades";
import BattleTacticCardInterf from "@/shared-lib/BattleTacticCardInterf";
import { Force } from "@/shared-lib/Force";
import UnitInterf from "@/shared-lib/UnitInterface";
import { fetchArmies } from "./fetchWithLoadingDisplay";
import { fetchRegimentsOfRenown } from "./regimentsOfRenown";
import { fetchTactics } from "./tactics";
import { unitsApi } from "./units";
import { fetchUpgrades } from "./upgrades";
import AppSettings from "../AppSettings";

interface UnitLUT {
    [id: string]: UnitInterf
}

interface ArmyCache {
    upgrades: ArmyUpgrades | null;
    units: UnitLUT | null;
    regimentsOfRenown: Force[] | null;
}

interface Alliance {
    name: string,
    alliance: string
};

export default class LocalCache {
    _version: string;
    _tactics: null | BattleTacticCardInterf[];
    _armies: null | Alliance[];
    _armyData: {[armyName: string]: ArmyCache | undefined};
    constructor(currentVersion?: string) {
        const version = localStorage.getItem('local-cache-version');
        if (version)
            this._version = version;
        else
            this._version = '';
        this._tactics = null;
        this._armies = null;
        this._armyData = {};

        let loadCache = true;
        if (currentVersion) {
            if (this._version !== currentVersion){
                this.clear();
            }
        }
        if (loadCache)
            this.load();
    }
    getData(army: string): ArmyCache {
        let data = this._armyData[army];
        if (data)
            return data;
        data = {
            upgrades: null,
            units: null,
            regimentsOfRenown: null
        };
        this._armyData[army] = data;
        return data;
    }
    async getUnits(army: string | null): Promise<UnitLUT | null> {
        const data = this.getData(army ? army : 'core');
        if (data.units)
            return data.units;
        const units = await unitsApi.get(army);
        if (units) {
            data.units = units;
            this.save();
        }

        const appSettings = new AppSettings;
        if (units && !appSettings.settings()["Display Legends"]) {
            const keys = Object.getOwnPropertyNames(units);
            keys.forEach(key => {
                if (units[key]._tags.includes('Legends')) {
                    delete units[key];
                }
            });
        }
        return units;
    }
    async getUpgrades(army: string): Promise<ArmyUpgrades | null> {
        const data = this.getData(army);
        if (data.upgrades)
            return data.upgrades;
        const upgrades = await fetchUpgrades(army);
        if (upgrades) {
            data.upgrades = upgrades;
            this.save();
        }
        return upgrades;
    }
    async getRegimentsOfRenown(army?: string): Promise<Force[] | null> {
        const data = this.getData(army ? army : 'core');
        if (data.regimentsOfRenown)
            return data.regimentsOfRenown;
        const ror = await fetchRegimentsOfRenown(army);
        if (ror) {
            data.regimentsOfRenown = ror;
            this.save();
        }
        return ror;
    }
    async getTactics(): Promise<BattleTacticCardInterf[] | null> {
        if (this._tactics)
            return this._tactics;
        const tactics = await fetchTactics();
        if (tactics) {
            this._tactics = tactics;
            this.save();
        }
        return tactics;
    }
    async getArmies(): Promise<Alliance[] |  null> {
        if (this._armies)
            return this._armies;
        let alliances: Alliance[] | null = null;
        await fetchArmies((result: unknown) => {
            alliances = result as Alliance[] | null;   
            if (alliances) {
                this._armies = alliances;
                this.save();
            }
        });
        return alliances;
    }
    clear() {
        localStorage.removeItem('local-cache-version');
        localStorage.removeItem('local-cache-tactics');
        localStorage.removeItem('local-cache-armies');
        localStorage.removeItem('local-cache-army-data');
    }
    load() {
        const tactics = localStorage.getItem('local-cache-tactics');
        if (tactics) {
            this._tactics = JSON.parse(tactics) as BattleTacticCardInterf[];
        }
        const armies = localStorage.getItem('local-cache-armies');
        if (armies) {
            this._armies = JSON.parse(armies) as {name: string, alliance: string}[];
        }
        const armyData = localStorage.getItem('local-cache-army-data');
        if (armyData) {
            this._armyData = JSON.parse(armyData) as {[armyName: string]: ArmyCache | undefined};
        }
    }
    save() {
        localStorage.setItem('local-cache-version', this._version);
        if (this._tactics) {
            localStorage.setItem('local-cache-tactics', JSON.stringify(this._tactics));
        }
        if (this._armies) {
            localStorage.setItem('local-cache-armies', JSON.stringify(this._armies));
        }
        if (this._armyData) {
            localStorage.setItem('local-cache-army-data', JSON.stringify(this._armyData));
        }
    }
}
const isOnlineSet = false;
export let onlineAtLaunch: boolean = false;
let globalCache: LocalCache | null = null

export const isOnline = async (): Promise<boolean> => {
  if (isOnlineSet)
    return onlineAtLaunch;

  if (navigator.onLine) {
    try {
      await fetch("https://www.google.com/favicon.ico", { method: "HEAD", mode: "no-cors" });
      return true;
    } catch (error: unknown) {
    
    }
  }
  return false;
}

export const getGlobalCache = (): LocalCache | null => {
    return globalCache;
}

export const initializeGlobalCache = async (version: string) => {
  if (onlineAtLaunch) {
    globalCache = new LocalCache(version);
  } else {
    globalCache = new LocalCache();
  }
}