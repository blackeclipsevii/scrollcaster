import Upgrade from "./Upgrade.js";

export interface Force {
    selectableIn: string[];
    id: string;
    name: string;
    unitContainers: unknown[];
    upgrades: Upgrade[];
    points: number;
}