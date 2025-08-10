import Ability from "./Ability.js";
import { BsSelectionEntry, BsSelectionEntryGroup } from "./lib/bs/BsCatalog.js";
import AgeOfSigmar from "./AgeOfSigmar.js";
import Weapon from "./Weapon.js";
import OptionSet, {Options, Option} from "../shared-lib/Options.js";

export const parseOptions = (optionSets: OptionSet[], ageOfSigmar: AgeOfSigmar, optionsGroups: BsSelectionEntryGroup[]) => {
    const addOptionSet = (og: BsSelectionEntryGroup) => {
        if (!og.selectionEntries)
            return;

        const setName = og["@name"];
        const options = new Options;

        const addOptions = (entry: BsSelectionEntry) => {
            const optionName = entry["@name"];
            if (entry.profiles) {
                entry.profiles.forEach(profile => {
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
        
            if (entry.modifiers) {
                const option = new Option(optionName);
                entry.modifiers.forEach(modifer => {
                    if (modifer["@type"] === 'add' &&
                        modifer["@field"] === 'category') {
                        const keywordLUT = ageOfSigmar.keywordLUT as {[key:string]: string};
                        const value = keywordLUT[modifer["@value"]];
                        option.keywords.push(value ? value : modifer["@value"]);
                    }
                });
                options[optionName] = option;
            }

            if (entry.selectionEntries) {
                entry.selectionEntries.forEach(nestedEntry => {
                    addOptions(nestedEntry);
                });
            }
        }

        og.selectionEntries.forEach(optionEntry => {
            addOptions(optionEntry);
        });

        optionSets.push(new OptionSet(setName, options));
    }

    optionsGroups.forEach(optionGroup => {

        addOptionSet(optionGroup);
    });
}
