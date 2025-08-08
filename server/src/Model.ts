import { BsSelectionEntry, BsProfile } from "./lib/bs/BsCatalog.js";
import AgeOfSigmar from "./AgeOfSigmar.js";
import Weapon from "./Weapon.js";

import OptionSet, {parseOptions} from "./OptionSet.js";

export default class Model {
    id: string;
    name: string;
    min: number;
    max: number;
    weapons: Weapon[];
    optionSets: OptionSet[];
    constructor(ageOfSigmar: AgeOfSigmar, modelSe: BsSelectionEntry) {
        this.id = modelSe["@id"];
        this.name = modelSe["@name"];
        this.weapons = [];
        this.optionSets = [];
        this.min = 0;
        this.max = 0;
        this._parse(ageOfSigmar, modelSe);
    }
    _parse(ageOfSigmar: AgeOfSigmar, modelSe: BsSelectionEntry) {
        const parseProfiles = (profiles: BsProfile[]) => {
            profiles.forEach(profile => {
                if (profile["@typeName"].includes('Weapon')) {
                    const myWeapon = new Weapon(profile);
                    this.weapons.push(myWeapon);
                }
            });
        }
        
        // model counts
        if (modelSe.constraints) {
            modelSe.constraints.forEach(constraint => {
                if (constraint['@field'] === 'selections') {
                    if (constraint["@type"] === 'min') {
                        this.min = Number(constraint["@value"]);
                    } else if (constraint['@type'] === 'max') {
                        this.max = Number(constraint["@value"]);
                    }
                }
            });
        }

        // weapons ?
        if (modelSe.selectionEntries) {
            for (let j = 0; j < modelSe.selectionEntries.length; ++j) {
                const entry = modelSe.selectionEntries[j];
                if (entry.profiles)
                    parseProfiles(entry.profiles)
            }
        }
        // weapons ?
        if (modelSe.profiles) {
            parseProfiles(modelSe.profiles);
        }

        if (modelSe.selectionEntryGroups) {
            parseOptions(this.optionSets, ageOfSigmar, modelSe.selectionEntryGroups);
        }
    }
}