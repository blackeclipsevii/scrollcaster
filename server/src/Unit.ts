import Ability from "./Ability.js";
import Weapon from "./Weapon.js";

import { UnitType, strToUnitType } from "./types/UnitType.js";
import { WeaponType } from "./Weapon.js";
import { BsCategoryLink, BsCharacteristic, BsProfile, BsSelectionEntry, BsSelectionEntryGroup } from "./lib/bs/BsCatalog.js";
import Upgrade from "./Upgrade.js";
import { Metadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";
import AgeOfSigmar from "./AgeOfSigmar.js";

export class Option {
    name: string;
    weapons: Weapon[];
    abilities: Ability[];
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

export class OptionSet {
    name: string;
    options: Options;
    selection: (Option|null);
    constructor(name: string, options: Options) {
        this.name = name;
        this.options = options;
        this.selection = null;
    }
}

export default class Unit {
    name: string;
    id: string;

    isGeneral: boolean;
    isWarmaster: boolean;
    isReinforced: boolean;

    canHaveHeroicTrait: boolean;
    canHaveArtefact: boolean;
    canBeReinforced: boolean;
    
    points: number;
    type: number;

    monstrousTraits: Upgrade | null;
    heroicTrait: Upgrade | null;
    artefact: Upgrade | null;
    weapons: Weapon[];
    optionSets: OptionSet[];
    abilities: Ability[];
    keywords: string[];
    _tags: string[];

    constructor(ageOfSigmar: AgeOfSigmar, selectionEntry: BsSelectionEntry) {
        this.name = selectionEntry['@name'];
        this.id = selectionEntry['@id'];
        
        this.isGeneral = false;
        this.isWarmaster = false; // must be general if able

        this.monstrousTraits = null;

        this.canHaveHeroicTrait = false;
        this.heroicTrait = null;

        this.canHaveArtefact = false;
        this.artefact = null;
        
        this.canBeReinforced = false;
        this.isReinforced = false;

        this.optionSets = [];
        this.weapons = [];
        this.abilities = [];
        this.keywords = [];

        this.points = 0;
        this._parse(ageOfSigmar, selectionEntry);
        this.type = UnitType.Unknown;
        this.keywords.forEach(keyword => {
            let type = strToUnitType(keyword);
            if (this.type !== UnitType.Manifestation &&
                type < this.type)
                this.type = type;
        });

        // tags used for logic, like Leader or Lumineth Paragon
        this._tags = [];
    }

    _parseKeywords(categoryLinks: BsCategoryLink[]) {
        this.keywords = [];
        for (let i = 0; i < categoryLinks.length; ++i) {
            let link = categoryLinks[i];
            const keyword = link['@name'];
            if (keyword === 'WARMASTER') {
                this.isWarmaster = true;
            }
            this.keywords.push(keyword);
        }
    }

    _parseCharacteristics(chars: BsCharacteristic[]) {
        for (let i = 0; i < chars.length; ++i) {
            let char = chars[i];
            const cName = new String(char['@name']).trim();
            if (char['#text'])
                (this as unknown as Metadata)[cName] = char['#text'].toString();
        }
    }

    _parseModels(ageOfSigmar: AgeOfSigmar, modelEntries: BsSelectionEntry[]) {
        const parseProfiles = (profiles: BsProfile[]) => {
            profiles.forEach(profile => {
                if (profile["@typeName"].includes('Weapon')) {
                    const myWeapon = new Weapon(profile);
                    this.weapons.push(myWeapon);
                }
            });
        }

        modelEntries.forEach(modelEntry => {
            // weapons ?
            if (modelEntry.selectionEntries) {
                for (let j = 0; j < modelEntry.selectionEntries.length; ++j) {
                    const entry = modelEntry.selectionEntries[j];
                    if (entry.profiles)
                        parseProfiles(entry.profiles)
                }
            }
            // weapons ?
            if (modelEntry.profiles) {
                parseProfiles(modelEntry.profiles);
            }

            if (modelEntry.selectionEntryGroups) {
                this._parseOptions(ageOfSigmar, modelEntry.selectionEntryGroups);
            }
        });
    }

    _parseOptions(ageOfSigmar: AgeOfSigmar, optionsGroups: BsSelectionEntryGroup[]) {
        optionsGroups.forEach(optionGroup => {
            if (!optionGroup.selectionEntries)
                return;

            const setName = optionGroup["@name"];
            const options = new Options;
            optionGroup.selectionEntries.forEach(optionEntry => {
                const optionName = optionEntry["@name"];
                if (optionEntry.profiles) {
                    optionEntry.profiles.forEach(profile => {
                        if (profile["@typeName"].includes('Ability')) {
                            const ability = new Ability(profile);
                            if (options[optionName]) {
                                options[optionName].abilities.push(ability);
                            } else {
                                const option = new Option(optionName);
                                option.abilities.push(ability);
                                options[optionName] = option;
                            }
                        } 
                        if (profile["@typeName"].includes('Weapon')) {
                            const myWeapon = new Weapon(profile);
                            if (options[optionName]) {
                                options[optionName].weapons.push(myWeapon);
                            } else {
                                const option = new Option(optionName);
                                option.weapons.push(myWeapon);
                                options[optionName] = option;
                            }
                        }
                    });
                }
                if (optionEntry.modifiers) {
                    const option = new Option(optionName);
                    optionEntry.modifiers.forEach(modifer => {
                        if (modifer["@type"] === 'add' &&
                            modifer["@field"] === 'category') {
                            const keywordLUT = ageOfSigmar.keywordLUT as {[key:string]: string};
                            const value = keywordLUT[modifer["@value"]];
                            option.keywords.push(value ? value : modifer["@value"]);
                        }
                    });
                    options[optionName] = option;
                }
            });
            this.optionSets.push(new OptionSet(setName, options));
        });
    }

    _parse(ageOfSigmar: AgeOfSigmar, selectionEntry: BsSelectionEntry) {
        if (selectionEntry.categoryLinks) 
            this._parseKeywords(selectionEntry.categoryLinks);

        // to-do profiles of different types?
        if (selectionEntry.profiles)
            for (let i = 0; i < selectionEntry.profiles.length; ++i) {
                const profile = selectionEntry.profiles[i];
                const typeName = profile['@typeName'];
                if (typeName === 'Unit' || typeName === 'Manifestation') {
                    this._parseCharacteristics(profile.characteristics);
                }
                else if (typeName.includes('Ability')) {
                    this.abilities.push(new Ability(profile));
                }
            }

        if (selectionEntry.selectionEntries) {
            this._parseModels(ageOfSigmar, selectionEntry.selectionEntries);
        }

        // the options can be on the unit level not the model level
        if (selectionEntry.selectionEntryGroups) {
            this._parseOptions(ageOfSigmar, selectionEntry.selectionEntryGroups);
        }
    }
}