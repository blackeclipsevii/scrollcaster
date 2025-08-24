import OptionSet from "./Options.js";
import { WeaponsInterf } from "./WeaponInterf.js";

export default interface ModelInterf {
    id: string;
    name: string;
    min: number;
    max: number;
    weapons: WeaponsInterf;
    optionSets: OptionSet[];
}