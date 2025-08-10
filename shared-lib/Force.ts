import UnitInterf from "./UnitInterface.js";
import UpgradeInterf from "./UpgradeInterface.js";

export interface UnitContainerInterf {
    unit: UnitInterf,
    min: number,
    max: number
};

export interface Force {
    selectableIn: string[];
    id: string;
    name: string;
    unitContainers: UnitContainerInterf[];
    upgrades: UpgradeInterf[];
    points: number;
}