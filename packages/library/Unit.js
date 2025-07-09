import { AbilityType } from "./Ability.js";
import Ability from "./Ability.js";
import { WeaponType } from "./Weapon.js";
import Weapon from "./Weapon.js";

export const UnitType = {
    Hero: 0,
    Infantry: 1,
    Cavalry: 2,
    Beast: 3,
    Monster: 4,
    WarMachine: 5,
    Manifestation: 6,
    Terrain: 7
}

export function strToUnitType(str) {
    const upper = str.toUpperCase();
    if (upper.includes('HERO')) {
        return UnitType.Hero;
    } else if (upper.includes('INFANTRY')) {
        return UnitType.Infantry;
    } else if (upper.includes('CAVALRY')) {
        return UnitType.Cavalry;
    } else if (upper.includes('BEAST')) {
        return UnitType.Beast;
    } else if (upper.includes('MONSTER')) {
        return UnitType.Monster;
    } else if (upper.includes('MACHINE')) {
        return UnitType.WarMachine;
    } else if (upper.includes('MANIFEST')) {
        return UnitType.Manifestation;
    } else if (upper.includes('TERRAIN')) {
        return UnitType.Terrain;
    }
}

export default class Unit {
    constructor(selectionEntry) {
        this.abilities = [];
        this._parse(selectionEntry);
        this.type = strToUnitType(this.keywords.join(' '));
    }

    _parseKeywords(categoryLinks) {
        this.keywords = [];
        for (let i = 0; i < categoryLinks.length; ++i) {
            let link = categoryLinks[i];
            this.keywords.push(link['@name']);
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
        
        this._parseKeywords(selectionEntry.categoryLinks);

        // to-do profiles of different types?
        for (let i = 0; i < selectionEntry.profiles.length; ++i) {
            const profile = selectionEntry.profiles[i];
            const typeName = profile['@typeName'];
            if (typeName === 'Unit') {
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