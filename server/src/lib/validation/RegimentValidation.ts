import Army from "../../Army.js";
import { Regiment } from "../../Roster.js";
import Unit from "../../Unit.js";
import { UnitType } from "../../../shared-lib/UnitInterface.js";

interface KeyOpt {
    keyword: string;
    index: number;
}

// check if a keyword is a non (really only seraphon)
const _hasNonPrefix = (options: string, keyOpt: KeyOpt) => {
    // Check if the 4 characters before the needle are 'non-'
    const substr = options.slice(keyOpt.index - 4, keyOpt.index).toUpperCase().trim();
    return substr.startsWith('NON');
}

const getKeywordsFromOption = (option: string): KeyOpt[] => {
    option = option.trim();
    // let optionQualifier = option.split(' ')[0];
    const regex = /<([^>]+)>/g;
    const optionKeywords: KeyOpt[] = [];
    for (const match of option.matchAll(regex)) {
        optionKeywords.push({
            keyword: match[1].toUpperCase(),
            index: match.index
        });
    }
    return optionKeywords;
}

const meetsOption = (unit: Unit, option: string, optionKeywords: KeyOpt[], availableKeywords: string[]) => {
    const testKeyOpt = (allTags: string[], keyOpt: KeyOpt) => {
        const isNon = _hasNonPrefix(option, keyOpt);

        // alphanumeric and whitespace
        const keywordCompare = (a: string, b: string) => {
            const regex = /[^a-zA-Z0-9\s]+/g;
            return a.replace(regex, '') === b.replace(regex, '');
        }
        
        if (allTags.some(tag => keywordCompare(tag, keyOpt.keyword))) {
            return !isNon;
        }
        
        if (!availableKeywords.includes(keyOpt.keyword))
        {
            const name = unit.name.toUpperCase();
            if (keywordCompare(keyOpt.keyword, unit.name.toUpperCase())) {
                return !isNon;
            }
            
            if (name.includes(',')) {
                const nameNoTitle = name.split(',')[0];
                if (keyOpt.keyword === nameNoTitle) {
                    return !isNon;
                }
            }
        }

        return isNon
    }
    
    const getAllTags = (unit: Unit) => {
        let allTags = unit._tags;
        if (unit.type !== 0)  // only look at every keyword if it's not a hero
            allTags = allTags.concat(unit.keywords);

        // normalize on uppercase and sort
        return allTags.join(',').toUpperCase().split(',');
    }

    const itrFunc = option.includes(' OR ') ? 'some' : 'every';
    const allTags = getAllTags(unit);

    return optionKeywords[itrFunc]((keyOpt: KeyOpt) => {
        return testKeyOpt(allTags, keyOpt);
    });
}

export const RegimentValidator = {
    validateRegiment: (regiment: Regiment, availableKeywords: string[]) => {
        const leader = regiment.leader;
        if (!leader)
            return `No leader`;

        const options = leader.battleProfile?.regimentOptions.split(',');
        if (!options)
            return `${leader.name} cannot lead. They have no regiment options.`;

        class _Slot {
            originalOption: string;
            min: number;
            max: number;
            conditional: string;
            keywords: KeyOpt[];
            units: Unit[];
            priority: number;
            constructor(option: string) {
                const optionUC = option.trim().toUpperCase();
                const qualifier = (() => {
                    const requiredStr = '(REQUIRED)';
                    if (optionUC.includes(requiredStr))
                        return 'REQUIRED';

                    return optionUC.split(' ')[0];
                })();
                const isRequired = qualifier === 'REQUIRED';

                this.originalOption = option;
                this.min = isRequired ? 1 : 0;
                this.max = isRequired ? 1 : 100;
                this.conditional = optionUC.includes(' OR ') ? 'or' : 'and';
                this.keywords = getKeywordsFromOption(option.toUpperCase());
                this.units = [];
                this.priority = isRequired ? 100 : 50; //0-100
                
                if (qualifier.includes('-')) {
                    const minMax = qualifier.split('-');
                    this.min = Number(minMax[0]);
                    this.max = Number(minMax[1]);
                }
            }

            meetsKeywordRequirements(unit: Unit) {
                return meetsOption(unit, this.originalOption.toUpperCase(), this.keywords, availableKeywords)
            }

            canAdd(unit: Unit) {
                if (this.units.length === this.max) {
                    const error = `You can only select ${this.originalOption}`;
                    console.log(error);
                    return error;
                }

                return null;
            }

            add(unit: Unit) {
                this.units.push(unit);
            }

            areRequirementsMet() {
                if (this.min > this.units.length) {
                    return false;
                }
                return true;
            }
        }

        let slots: _Slot[] = []
        // initialize the expect slots
        const canLead = options.every(option => {
            const optionUc = option.trim().toUpperCase();
            if (optionUc === 'NONE')
                return false;

            const slot = new _Slot(option);
            slots.push(slot);
            return true;
        });
        if (!canLead) {
            if (leader.battleProfile?.notes)
                return [`${leader.name} cannot be a leader: ${leader.battleProfile.notes}`];
            else
                return [`${leader.name} cannot be a leader!`];
        }
        slots = slots.sort((a, b) => b.priority - a.priority);

        // sort on spaces so we don't hit any keywords that match substrings of other keywords
        // longer keywords also take presidence
        //const sortedKeywords = sortKeywords(keywords);
        const slotUnit = (unit: Unit) => {
            const genericError = `Invalid Unit Selection: ${unit.name}`;
            if (unit.type as UnitType === UnitType.Manifestation ||
                unit.type as UnitType === UnitType.Terrain ||
                unit.type as UnitType === UnitType.Unknown
            ) {// it literally shouldn't be possible to hit this error
                return genericError;
            }
            
            let lastError: string | null = genericError;
            for (let i = 0; i < slots.length; ++i) {
                if (slots[i].meetsKeywordRequirements(unit)) {
                    const slotError = slots[i].canAdd(unit);
                    lastError = slotError;
                    if (!slotError) {
                        console.log(`${unit.name} met requirement for : ${slots[i].originalOption}`);
                        slots[i].add(unit);
                        return null;
                    }
                }
            }
            return lastError;
        }

        const errors: string[] = [];

        regiment.units.forEach((armyUnit) => {
            const message = slotUnit(armyUnit);
            if (message)
                errors.push(message);
        });

        slots.forEach(slot => {
            if (!slot.areRequirementsMet())
                errors.push(slot.originalOption);
        });

        return errors;
    },

    // get all the units available to a leader's regiment
    getRegimentOptions: (army: Army, leaderId: string, availableKeywords: string[]) => {
        const leader = army.units[leaderId];
        const options = leader.battleProfile?.regimentOptions.toUpperCase().split(',');
        if(!options) {
            console.log(`${leader.name} as no regiment options.`);
            return;
        }

        const armyUnits = Object.values(army.units);
        const allUnitNames = [];
        armyUnits.forEach(aUnit => {
            allUnitNames.push(aUnit.name.toUpperCase());
        });

        // sort on spaces so we don't hit any keywords that match substrings of other keywords
        // longer keywords also take presidence
        //const sortedKeywords = sortKeywords(keywords);
        const canFieldUnit = (unit: Unit) => {
            if (unit.type as UnitType === UnitType.Manifestation ||
                unit.type as UnitType === UnitType.Terrain ||
                unit.type as UnitType === UnitType.Unknown
            ) { // these don't go in a regiment
                return false;
            }

            // const requiredStr = '(REQUIRED)';
            let ok: boolean = false;
            options.forEach(option => {
                if (ok) return true;

                option = option.trim();
                const optionKeywords = getKeywordsFromOption(option);
                ok = ok || meetsOption(unit, option, optionKeywords, availableKeywords);
            });

            return ok;
        }

        const units: Unit[] = [];
        armyUnits.forEach(unit => {
            if (canFieldUnit(unit)) {
                units.push(unit);
            }
        });
        return units;
    }
};