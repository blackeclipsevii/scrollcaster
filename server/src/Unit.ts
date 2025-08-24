import Ability from "./Ability.js";

import { UnitType, strToUnitType } from "@scrollcaster/shared-lib/UnitInterface.js";
import { BsCategoryLink, BsCharacteristic, BsEntryLink, BsSelectionEntry } from "./lib/bs/BsCatalog.js";
import { Metadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";
import AgeOfSigmar from "./AgeOfSigmar.js";
import BattleProfile from "@scrollcaster/shared-lib/BattleProfile.js";

import Model from "./Model.js";
import OptionSet from "@scrollcaster/shared-lib/Options.js";
import { parseOptions } from "./parseOptions.js";

import UnitInterf, { EnhancementSlotInterf, UnitSuperType } from "@scrollcaster/shared-lib/UnitInterface.js";

export const isUndersizedUnit = (entry: BsEntryLink) => {
    let undersized = false;
    if (entry.categoryLinks) {
        //to-do allow undersized units
        undersized = !entry.categoryLinks.every(catLink => {
            if (catLink['@name'] === 'Undersize Unit') {
                return false;
            }
            return true;
        });
    }
    return undersized;
}

export default class Unit implements UnitInterf {
    name: string;
    id: string;

    legends: boolean;

    Move: string;
    Health: string;
    Control: string;
    Save: string;

    isWarmaster: boolean;
    
    canBeGeneral: boolean;
    isGeneral: boolean;

    canBeReinforced: boolean;
    isReinforced: boolean;

    points: number;
    type: number;
    superType: string;

    models: Model[];

    enhancements: {[name: string]: EnhancementSlotInterf};
    abilities: Ability[];
    keywords: string[];
    optionSets: OptionSet[];
    battleProfile: BattleProfile | null;
    _tags: string[];

    constructor(ageOfSigmar: AgeOfSigmar, selectionEntry: BsSelectionEntry) {
        this.name = selectionEntry['@name'];
        this.id = selectionEntry['@id'];
        this.superType = UnitSuperType;
        
        this.legends = false;
        this.Move = '';
        this.Health = '';
        this.Control = '';
        this.Save = '';
        
        this.canBeGeneral = true;
        this.isGeneral = false;
        this.isWarmaster = false; // must be general if able

        this.enhancements = {};

        this.canBeReinforced = false;
        this.isReinforced = false;

        this.models = [];
        this.abilities = [];
        this.keywords = [];
        this.optionSets = [];
        // tags used for logic, like Leader or Lumineth Paragon
        this._tags = [];
        this.battleProfile = null;

        this.points = 0;
        this._parse(ageOfSigmar, selectionEntry);
        this.type = UnitType.Unknown;
        this.keywords.forEach(keyword => {
            const type = strToUnitType(keyword);
            if (this.type as UnitType !== UnitType.Manifestation && (type as number) < this.type)
                this.type = type;
        });
    }

    _parseKeywords(categoryLinks: BsCategoryLink[]) {
        this.keywords = [];
        for (let i = 0; i < categoryLinks.length; ++i) {
            const link = categoryLinks[i];
            const keyword = link['@name'];
            if (keyword === 'WARMASTER') {
                this.isWarmaster = true;
            }
            if (keyword === 'Legends') {
                this.legends = true;
            }
            this.keywords.push(keyword);
        }
    }

    _parseCharacteristics(chars: BsCharacteristic[]) {
        for (let i = 0; i < chars.length; ++i) {
            const char = chars[i];
            const cName = new String(char['@name']).trim();
            if (char['#text'] !== undefined)
                (this as unknown as Metadata)[cName] = char['#text'].toString();
        }
    }

    _parseModels(ageOfSigmar: AgeOfSigmar, modelEntries: BsSelectionEntry[], unitEntry: BsSelectionEntry) {
        modelEntries.forEach(modelEntry => {
            const model = new Model(ageOfSigmar, modelEntry, unitEntry);
            this.models.push(model);
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
            this._parseModels(ageOfSigmar, selectionEntry.selectionEntries, selectionEntry);
        }

        // the options can be on the unit level not the model level
        if (selectionEntry.selectionEntryGroups) {
            parseOptions(this.optionSets, ageOfSigmar, selectionEntry.selectionEntryGroups);
        }

        // look for legends flag
        if (selectionEntry.modifiers) {
            selectionEntry.modifiers.forEach(modifier => {
                if (modifier["@type"] === 'set' && modifier["@field"] === 'hidden') {
                    if (modifier.conditions) {
                        modifier.conditions.forEach(condition => {
                            if (condition["@childId"] === ageOfSigmar.notableIds.allowLegends) {
                                this.legends = true;
                            }
                        });
                    }
                }
            });
        }
    }
}