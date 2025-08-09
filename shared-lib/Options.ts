import AbilityInterf from "./AbilityInterface.js";
import WeaponInterf from "./WeaponInterf.js";

export class Option {
    name: string;
    weapons: WeaponInterf[];
    abilities: AbilityInterf[];
    keywords: string[];
    constructor(name: string) {
        this.name = name;
        this.weapons = [];
        this.abilities = [];
        this.keywords = [];
    }
}

export class Options {
    [name: string]: Option;
}

export default class OptionSet {
    name: string;
    options: Options;
    selection: (Option|null);
    constructor(name: string, options: Options) {
        this.name = name;
        this.options = options;
        this.selection = null;
    }
}
