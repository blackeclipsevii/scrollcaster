import { ArmyUpgrades } from "./ArmyUpgrades.js";
import { Force } from "./Force.js";
import UnitInterf from "./UnitInterface.js";

export default interface ArmyInterf {
    id: string;
    name: string;
    points: {[name:string]: number};
    units: {[name:string]: UnitInterf};
    upgrades: ArmyUpgrades;
    keywordLUT: {[name:string]: string};
    regimentsOfRenown: Force[];
    _tags: {[name:string]: string};
    isArmyOfRenown: boolean;
}