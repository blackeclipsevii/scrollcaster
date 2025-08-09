import WeaponInterf, {WeaponsInterf, WeaponType} from "../../shared-lib/WeaponInterf.js";
import { BsProfile } from "./lib/bs/BsCatalog.js"
import { bsCharacteristicArrToMetadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";
import { WeaponSelectionSet } from "../../shared-lib/WeaponInterf.js";

export default class Weapon implements WeaponInterf {
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
            throw `Invalid type for constructing Weapon: ${profileXml["@typeName"]}`;
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

export class WeaponSelection {
    name: string;
    id: string;
    min: number;
    max: number;
    per: string;
    replacedBy: string[];
    weapons: Weapon[];
    constructor(name: string, id: string) {
        this.name = name;
        this.id = id;
        this.per = 'model';
        this.min = 0;
        this.max = -1;
        this.replacedBy = [];
        this.weapons = [];
    }
}

// maybe overkill
export class Weapons implements WeaponsInterf {
    // always there
    warscroll: Weapon[];
    // selectable, doesn't affect others
    selections: WeaponSelection[];
    // exclusive
    selectionSets: WeaponSelectionSet[];
    constructor() {
        this.warscroll = [];
        this.selections = [];
        this.selectionSets = [];
    }
    
    addSelection(selection: WeaponSelection) {
        this.selections.push(selection);
    }

    generateSetsFromSelections() {
        this.selections.forEach(optSelect => {
            if (optSelect.per === 'unit') {
                const newSet: WeaponSelectionSet = {
                    options: [optSelect]
                };

                // remove the optional element
                this.selections = this.selections.filter(fSelect => fSelect.id != optSelect.id);
                this.selectionSets.push(newSet);
            }
        });

        this.selections.forEach(defaultSelection => {
            defaultSelection.replacedBy.forEach(replacementId => {
                this.selectionSets.forEach(selectionSet => {
                    selectionSet.options.every(optionalSelection => {
                        if (optionalSelection.id === replacementId) {
                            selectionSet.options.push(defaultSelection);
                            return false;
                        }
                        return true;
                    });
                });
            });
        });
    }
}
