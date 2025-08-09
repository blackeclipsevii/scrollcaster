import UpgradeInterf from "./UpgradeInterface.js";
export interface Force {
    selectableIn: string[];
    id: string;
    name: string;
    unitContainers: unknown[];
    upgrades: UpgradeInterf[];
    points: number;
}