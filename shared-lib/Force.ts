import { BasicObject } from "./BasicObject.js";
import UnitInterf from "./UnitInterface.js";
import UpgradeInterf from "./UpgradeInterface.js";

export interface UnitContainerInterf {
    unit: UnitInterf,
    min: number,
    max: number
};

export interface Force extends BasicObject {
    selectableIn: string[];
    unitContainers: UnitContainerInterf[];
    upgrades: UpgradeInterf[];
}

export interface ForceLUT {
    [name: string]: Force;
}