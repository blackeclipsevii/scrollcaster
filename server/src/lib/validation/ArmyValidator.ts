import Army from "../../Army.js";
import Roster, { Regiment } from "../../Roster.js";

export interface ArmyValidator {
    validate(army: Army, roster: Roster): string[] | null;
}

export const mustBeYourGeneral = (name: string, regiments: Regiment[], mustBeIncluded: boolean) => {
    let isIncluded = false;
    const isGeneral = !regiments.every(regiment => {
        if (!regiment.leader)
            return true;

        if (regiment.leader.name === name) {
            isIncluded = true;
            return !(regiment.leader.isGeneral);
        }

        return true;
    });

    if (mustBeIncluded && !isIncluded) {
        return [`${name} must be included.`];
    }

    if (!isGeneral) {
        // not the general
        if (!isIncluded) {
            if (mustBeIncluded) {
                // required to include but isnt
                return [`${name} must be included and must be your general.`]
            } else {
                // not included and doesn't have to be
                return null;
            }
        }

        // is included but isn't the general
        return [`${name} must be your general.`];
    }

    // is the general great job
    return null;
}

export const noRegimentOfRenown = (roster: Roster) => {
    if (roster.regimentOfRenown) {
        return ['You cannot include a regiment of renown.'];
    }
    return null;
}

export const noFactionTerrain = (roster: Roster) => {
    if (roster.terrainFeature) {
        return ['You cannot include faction terrain.'];
    }
    return null;
}

export class ArmyValidatorCollection {
    _validators: { [name: string]: ArmyValidator };
    constructor() {
        this._validators = {};
    }
    add(name: string, validator: ArmyValidator) {
        this._validators[name] = validator;
    };
    get(name: string) {
        return this._validators[name];
    };
}

export const armyValidatorCollection = new ArmyValidatorCollection;