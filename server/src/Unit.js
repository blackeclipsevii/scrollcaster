import Ability from "./Ability.js";
import Weapon from "./Weapon.js";

import { UnitType, strToUnitType } from "./types/UnitType.js";
import { WeaponType } from "./Weapon.js";

export default class Unit {
    constructor(selectionEntry) {
        this.isGeneral = false;
        this.isWarmaster = false; // must be general if able

        this.canHaveHeroicTrait = false;
        this.heroicTrait = null;

        this.canHaveArtefact = false;
        this.artefact = null;
        
        this.canBeReinforced = false;
        this.isReinforced = false;

        this.abilities = [];
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

    _parseKeywords(categoryLinks) {
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

    _parseCharacteristics(chars) {
        for (let i = 0; i < chars.length; ++i) {
            let char = chars[i];
            const cName = new String(char['@name']).trim();
            this[cName] = char['#text'].toString();
        }
    }

    _parseAbility(profile) {
        const ability = new Ability(profile);
        this.abilities.push(ability);
    }

    _parseWeapons(selectionEntries) {
        this.ranged = []
        this.melee = []

        const parseProfiles = (profiles) => {
            if (!profiles)
                return;
            for (let w = 0; w < profiles.length; ++w) {
                const profile = profiles[w];
                const myWeapon = new Weapon(profile);
                if (myWeapon.type === WeaponType.Ranged) {
                    this.ranged.push(myWeapon);
                } else {
                    this.melee.push(myWeapon);
                }
            }
        }

        for (let i = 0; i < selectionEntries.length; ++i) {
            // constraints ???
            const se = selectionEntries[i];
            if (se.selectionEntries) {
                for (let j = 0; j < se.selectionEntries.length; ++j) {
                    const entry = se.selectionEntries[j];
                    parseProfiles(entry.profiles)
                }
            }
            if (se.profiles) {
                parseProfiles(se.profiles);
            }
        }
    }

    _parse(selectionEntry) {
        this.name = selectionEntry['@name'];
        this.id = selectionEntry['@id'];
        
        this._parseKeywords(selectionEntry.categoryLinks);

        // to-do profiles of different types?
        for (let i = 0; i < selectionEntry.profiles.length; ++i) {
            const profile = selectionEntry.profiles[i];
            const typeName = profile['@typeName'];
            if (typeName === 'Unit' || typeName === 'Manifestation') {
                this._parseCharacteristics(profile.characteristics);
            }
            else if (typeName.includes('Ability')) {
                this._parseAbility(profile);
            }
        }

        if (selectionEntry.selectionEntries)
            this._parseWeapons(selectionEntry.selectionEntries);
    }
}