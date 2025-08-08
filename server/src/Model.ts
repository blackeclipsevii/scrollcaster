import { BsSelectionEntry, BsProfile, BsConstraintInter } from "./lib/bs/BsCatalog.js";
import AgeOfSigmar from "./AgeOfSigmar.js";
import Weapon from "./Weapon.js";

import OptionSet, {Option, Options, parseOptions} from "./OptionSet.js";
import { ConditionType } from "./lib/bs/BsConstraint.js";

class WeaponSelection {
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

interface WeaponSelectionSet {
    options: WeaponSelection[];
}

// maybe overkill
class Weapons {
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

export default class Model {
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
                const weaponSelection = new WeaponSelection(entry["@name"], entry['@id']);
                let maxConstraintIds: string[] = [];

                if (entry.constraints) {
                    //<constraint type="max" value="1" field="selections" scope="9544-33d8-1d69-2be9" shared="true" id="a709-2d5c-ae85-6aeb" includeChildSelections="true"/>
                    entry.constraints.forEach(constraint => {
                        if (constraint["@field"] === 'selections') {
                            if (constraint["@type"] === 'max') {
                                if (constraint['@scope'] === unitEntry["@id"]) {
                                    weaponSelection.per = 'unit';
                                    weaponSelection.max = Number(constraint["@value"]);
                                }

                                if (weaponSelection.per !== 'unit') {
                                    weaponSelection.max = Number(constraint["@value"]);
                                }

                                maxConstraintIds.push(constraint["@id"])
                            } else if (constraint["@type"] === 'min') {
                                weaponSelection.min = Number(constraint["@value"]);
                            }
                        }
                    });

                    if (entry.modifiers && weaponSelection.per !== 'unit') {
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
                                            weaponSelection.replacedBy.push(condition["@childId"])
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
                                                    weaponSelection.replacedBy.push(condition["@childId"])
                                                }
                                            });
                                        }
                                    })
                                }
                            }
                        });
                    }
                }

                if (entry.profiles) {
                    parseProfiles(weaponSelection.weapons, entry.profiles)
                }

                this.weapons.addSelection(weaponSelection);
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