import WeaponInterf, {WeaponSelectionPer, WeaponsInterf, WeaponType} from "../shared-lib/WeaponInterf.js";
import { BsProfile } from "./lib/bs/BsCatalog.js"
import { bsCharacteristicArrToMetadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";
import { WeaponSelectionInterf } from "../shared-lib/WeaponInterf.js";

export default class Weapon implements WeaponInterf {
    [name: string]: string | number | null;
    id: string;
    name: string;
    type: number;
    Rng: string | null;
    Atk: string;
    Hit: string;
    Wnd: string;
    Rnd: string;
    Dmg: string;
    Ability: string;
    constructor(profileXml: BsProfile) {
        if (!profileXml["@typeName"].includes('Weapon')) {
            console.log(JSON.stringify(profileXml));
            throw new Error(`Invalid type for constructing Weapon: ${profileXml["@typeName"]}`);
        }

        this.id = profileXml["@id"];
        this.name = profileXml['@name'];
        const chars = profileXml.characteristics;
        this.type = WeaponType.Melee;
        if (profileXml['@typeName'] !== 'Melee Weapon')
            this.type = WeaponType.Ranged;
        
        const metadata = bsCharacteristicArrToMetadata(chars);
        this.Rng = metadata['Rng'] ? metadata['Rng'] : null;
        this.Atk = metadata['Atk'];
        this.Hit = metadata['Hit'];
        this.Wnd = metadata['Wnd'];
        this.Rnd = metadata['Rnd'];
        this.Dmg = metadata['Dmg'];
        this.Ability = metadata['Ability'];
    }
}

export class WeaponSelection implements WeaponSelectionInterf {
    name: string;
    id: string;
    min: number;
    max: number;
    per: WeaponSelectionPer;
    replaces: string[];
    weapons: Weapon[];

    // the underlying bsdata logic says what a weapon is replaced by
    // so basic weapon(replaced by) => advanced weapon
    //
    // this will be 'hidden' to the app
    _replacedBy: string[];
    constructor(name: string, id: string) {
        this.name = name;
        this.id = id;
        this.per = WeaponSelectionPer.Model;
        this.min = 0;
        this.max = -1;
        this.replaces = [];
        this._replacedBy = [];
        this.weapons = [];
    }
}

// maybe overkill
export class Weapons implements WeaponsInterf {
    warscroll: WeaponInterf[];
    // weapons that are equipped
    selected: WeaponInterf[];
    // all the weapon options
    selections: {[name: string]: WeaponSelectionInterf};

    constructor() {
        this.warscroll = [];
        this.selected = [];
        this.selections = {};
    }
    
    addSelection(selection: WeaponSelection) {
        this.selections[selection.id] = selection;
    }

    generateSetsFromSelections() {
        const basicWeapons: WeaponSelection[] = [];
        const advancedWeapons: WeaponSelection[] = [];

        // isolate all the basic options
        const selections = Object.values(this.selections);
        selections.forEach(optSelect => {
            if (optSelect.per === WeaponSelectionPer.Unit) {
                advancedWeapons.push(optSelect as WeaponSelection);
            } else {
                basicWeapons.push(optSelect as WeaponSelection);
            }
        });

        // add the replaces parameter to the advanced weapons
        basicWeapons.forEach(basicSelection => {
            basicSelection._replacedBy.forEach(replacementId => {
                advancedWeapons.every(advancedSelection => {
                    if (advancedSelection.id === replacementId) {
                        advancedSelection.replaces.push(basicSelection.id);
                        return false;
                    };
                    return true;
                });
            });
        });
    }
}
