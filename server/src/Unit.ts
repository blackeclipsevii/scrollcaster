import Ability from "./Ability.js";

import { UnitType, strToUnitType } from "./types/UnitType.js";
import { BsCategoryLink, BsCharacteristic, BsSelectionEntry } from "./lib/bs/BsCatalog.js";
import Upgrade from "./Upgrade.js";
import { Metadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";
import AgeOfSigmar from "./AgeOfSigmar.js";
import BattleProfile from "./lib/validation/BattleProfile.js";

import Model from "./Model.js";
import OptionSet, { parseOptions } from "./OptionSet.js";

export interface EnhancementSlot {
    name: string;
    id: string;
    slot: Upgrade | null;
}

export default class Unit {
    name: string;
    id: string;

    isWarmaster: boolean;
    
    canBeGeneral: boolean;
    isGeneral: boolean;

    canBeReinforced: boolean;
    isReinforced: boolean;

    points: number;
    type: number;

    models: Model[];

    enhancements: {[name: string]: EnhancementSlot};
    abilities: Ability[];
    keywords: string[];
    optionSets: OptionSet[];
    battleProfile: BattleProfile | null;
    _tags: string[];

    constructor(ageOfSigmar: AgeOfSigmar, selectionEntry: BsSelectionEntry) {
        this.name = selectionEntry['@name'];
        this.id = selectionEntry['@id'];
        
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
            let type = strToUnitType(keyword);
            if (this.type !== UnitType.Manifestation &&
                type < this.type)
                this.type = type;
        });
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

    _parseModels(ageOfSigmar: AgeOfSigmar, modelEntries: BsSelectionEntry[], parent: BsSelectionEntry) {
        modelEntries.forEach(modelEntry => {
            const model = new Model(ageOfSigmar, modelEntry, parent);
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
    }
}