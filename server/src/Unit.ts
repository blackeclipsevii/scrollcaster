import Ability from "./Ability.js";
import Weapon from "./Weapon.js";

import { UnitType, strToUnitType } from "./types/UnitType.js";
import { WeaponType } from "./Weapon.js";
import { BsCategoryLink, BsCharacteristic, BsProfile, BsSelectionEntry, BsSelectionEntryGroup } from "./lib/bs/BsCatalog.js";
import Upgrade from "./Upgrade.js";
import { Metadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";

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
    weaponOptions: (Weapon[])[];
    abilities: Ability[];
    keywords: string[];
    _tags: string[];

    constructor(selectionEntry: BsSelectionEntry) {
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

        this.weapons = [];
        this.weaponOptions = [];
        this.abilities = [];
        this.keywords = [];

        this.points = 0;
        this._parse(selectionEntry);
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

    _parseModels(modelEntries: BsSelectionEntry[]) {
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
                this._parseOptions(modelEntry.selectionEntryGroups);
            }
        });
    }

    _parseOptions(selectionEntryGroups: BsSelectionEntryGroup[]) {
        selectionEntryGroups.forEach(seg => {
            if (!seg.selectionEntries)
                return;

            const options: Weapon[] = [];
            seg.selectionEntries.forEach(segEntry => {
                if (segEntry.profiles) {
                    segEntry.profiles.forEach(profile => {
                        if (profile["@typeName"].includes('Ability')) {
                            this.abilities.push(new Ability(profile));
                        } 
                        if (profile["@typeName"].includes('Weapon')) {
                            const myWeapon = new Weapon(profile);
                            options.push(myWeapon);
                        }
                    });
                }
            });
            this.weaponOptions.push(options);
        });
    }

    _parse(selectionEntry: BsSelectionEntry) {
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
            this._parseModels(selectionEntry.selectionEntries);
        }
    }
}