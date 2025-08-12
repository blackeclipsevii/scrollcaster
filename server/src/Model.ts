import { BsSelectionEntry, BsProfile } from "./lib/bs/BsCatalog.js";
import AgeOfSigmar from "./AgeOfSigmar.js";
import Weapon, {Weapons, WeaponSelection} from "./Weapon.js";

import OptionSet from "../shared-lib/Options.js";
import { parseOptions } from "./parseOptions.js";
import ModelInterf from "../shared-lib/ModelInterface.js";
import { WeaponSelectionPer } from "../shared-lib/WeaponInterf.js";

export default class Model implements ModelInterf {
    id: string;
    name: string;
    min: number;
    max: number;
    weapons: Weapons;
    optionSets: OptionSet[];
    constructor(ageOfSigmar: AgeOfSigmar, modelSe: BsSelectionEntry, parent: BsSelectionEntry) {
        this.id = modelSe["@id"];
        this.name = modelSe["@name"];
        this.weapons = new Weapons;
        this.optionSets = [];
        this.min = 0;
        this.max = 0;
        this._parse(ageOfSigmar, modelSe, parent);
    }
    _parse(ageOfSigmar: AgeOfSigmar, modelSe: BsSelectionEntry, unitEntry: BsSelectionEntry) {
        let defaultAmountLUT: string[] = [];
        if (modelSe["@defaultAmount"]) {
            defaultAmountLUT = modelSe["@defaultAmount"].split(',');
        }
        
        const parseProfiles = (list: Weapon[], profiles: BsProfile[]) => {
            profiles.forEach(profile => {
                if (profile["@typeName"].includes('Weapon')) {
                    const myWeapon = new Weapon(profile);
                    list.push(myWeapon);
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
            modelSe.selectionEntries.forEach(entry => {
                let defaultAmount = 0;
                const weaponSelection = new WeaponSelection(entry["@name"], entry['@id']);
                const maxConstraintIds: string[] = [];

                if (entry["@defaultAmount"]) {
                    const daFlags = entry["@defaultAmount"].split(',');
                    daFlags.forEach((flag, idx) => {
                        if (Number(flag) > 0 && idx < defaultAmountLUT.length) {
                            defaultAmount += Number(defaultAmountLUT[idx]);
                        }
                    });
                }

                if (entry.constraints) {
                    //<constraint type="max" value="1" field="selections" scope="9544-33d8-1d69-2be9" shared="true" id="a709-2d5c-ae85-6aeb" includeChildSelections="true"/>
                    entry.constraints.forEach(constraint => {
                        if (constraint["@field"] === 'selections') {
                            if (constraint["@type"] === 'max') {
                                if (constraint['@scope'] === unitEntry["@id"]) {
                                    weaponSelection.per = WeaponSelectionPer.Unit;
                                    weaponSelection.max = Number(constraint["@value"]);
                                }

                                if (weaponSelection.per !== WeaponSelectionPer.Unit) {
                                    weaponSelection.max = Number(constraint["@value"]);
                                }

                                maxConstraintIds.push(constraint["@id"])
                            } else if (constraint["@type"] === 'min') {
                                weaponSelection.min = Number(constraint["@value"]);
                            }
                        }
                    });

                    if (entry.modifiers && weaponSelection.per !== WeaponSelectionPer.Unit) {
                        entry.modifiers.forEach(mod => {
                            if (mod["@type"] === 'set' &&
                                mod["@value"] === '0' &&
                                maxConstraintIds.includes(mod["@field"])) {
                                if (mod.conditions) {
                                    mod.conditions.forEach(condition => {
                                        // might need more or alternate conditions
                                        if (condition["@type"] === 'atLeast' &&
                                            condition["@value"] === '1'
                                        ) {
                                            weaponSelection._replacedBy.push(condition["@childId"])
                                        }
                                    });
                                }

                                if (mod.conditionGroups) {
                                    mod.conditionGroups.forEach(conditionGroup => {
                                        if (conditionGroup["@type"] === 'or') {
                                            conditionGroup.conditions.forEach(condition => {
                                                // might need more or alternate conditions
                                                if (condition["@type"] === 'atLeast' &&
                                                    condition["@value"] === '1'
                                                ) {
                                                    weaponSelection._replacedBy.push(condition["@childId"])
                                                }
                                            });
                                        }
                                    })
                                }
                            }
                        });
                    }
                }

                if (entry.profiles)
                    parseProfiles(weaponSelection.weapons, entry.profiles)

                // ko has nested entries
                if (entry.selectionEntries) {
                    entry.selectionEntries.forEach(nestedEntry => {
                        if (nestedEntry.profiles)
                            parseProfiles(weaponSelection.weapons, nestedEntry.profiles);
                    });
                }

                this.weapons.addSelection(weaponSelection);
                if (defaultAmount > 0 && weaponSelection.max > -1 && weaponSelection.per === WeaponSelectionPer.Unit)
                    this.weapons.selected[weaponSelection.name] = defaultAmount;
            });
            this.weapons.generateSetsFromSelections();
        }
        // weapons ?
        if (modelSe.profiles) {
            parseProfiles(this.weapons.warscroll, modelSe.profiles);
        }

        if (modelSe.selectionEntryGroups) {
            parseOptions(this.optionSets, ageOfSigmar, modelSe.selectionEntryGroups);
        }
    }
}