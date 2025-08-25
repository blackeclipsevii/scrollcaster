import Army from "../../Army.js";
import Roster, { Regiment } from "../../Roster.js";

import fs from 'fs'
import { namesEqual } from "../helperFunctions.js";
import RosterInterf from "../../../shared-lib/RosterInterface.js";

export interface ArmyValidator {
    validate(army: Army, roster: Roster): string[] | null;
}

// names can slightly differ between sources
// try to standardize them
export const processName = (name: string) => {
    return name.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
}

export const mustBeIncluded = (name: string, roster: RosterInterf) => {
    let isIncluded = roster.regiments.some(regiment => {
        if (regiment.leader && namesEqual(regiment.leader.name, name))
            return true;
        return regiment.units.some(unit => namesEqual(name, unit.name));
    });

    if (!isIncluded)
        isIncluded = roster.auxiliaryUnits.some(unit => namesEqual(name, unit.name));

    if (!isIncluded)
        return [`<${name}> must be included`];
    
    return null;
}

export const mustBeYourGeneral = (name: string, regiments: Regiment[], mustBeIncluded: boolean) => {
    let isIncluded = false;
    const isGeneral = !regiments.every(regiment => {
        if (!regiment.leader)
            return true;

        if (processName(regiment.leader.name).includes(processName(name))) {
            isIncluded = true;
            return !(regiment.leader.isGeneral);
        }

        return true;
    });

    if (mustBeIncluded && !isIncluded) {
        return [`<${name}> must be included.`];
    }

    if (!isGeneral) {
        // not the general
        if (!isIncluded) {
            if (mustBeIncluded) {
                // required to include but isnt
                return [`<${name}> must be included and must be your general`]
            } else {
                // not included and doesn't have to be
                return null;
            }
        }

        // is included but isn't the general
        return [`<${name}> must be your general`];
    }

    // is the general great job
    return null;
}

export const noRegimentOfRenown = (roster: Roster) => {
    if (roster.regimentOfRenown) {
        return ['cannot include a regiment of renown'];
    }
    return null;
}

export const noFactionTerrain = (roster: Roster) => {
    if (roster.terrainFeature) {
        return ['cannot include faction terrain'];
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

// just disallow ror
export class NoRorValidator implements ArmyValidator {
    validate(army: Army, roster: Roster): string[] | null {
        const errors = noRegimentOfRenown(roster);
        return errors && errors.length > 0 ? errors : null;
    }
};

// For the army that only requires a specific general and no ror
export class ForcedGeneralValidator {
    generalName: string;
    mustInclude: boolean;
    constructor(generalName: string, mustInclude: boolean) {
        this.generalName = generalName;
        this.mustInclude = mustInclude;
    }
    validate(army: Army, roster: Roster): string[] | null {
        const errors = mustBeYourGeneral(this.generalName, roster.regiments, this.mustInclude);
        return errors && errors.length > 0 ? errors : null;
    }
};

export class MustBeIncludedValidator {
    names: string[];
    constructor(names: string[]) {
        this.names = names;
    }
    validate(army: Army, roster: Roster): string[] | null {
        let errors: string[] = [];
        this.names.forEach(name => {
            const errs = mustBeIncluded(name, roster);
            if (errs) 
                errors = errors.concat(errs);
        });
        return errors && errors.length > 0 ? errors : null;
    }
};

export class MultiStepValidator {
    _validators: ArmyValidator[];
    constructor (validators: ArmyValidator[]) {
        this._validators = validators;
    }
    validate(army: Army, roster: Roster): string[] | null {
        let errors: string[] = [];
        for (let i = 0; i < this._validators.length; ++i) {
            const e = this._validators[i].validate(army, roster);
            if (e && e.length > 0)
                errors = errors.concat(e);
        }
        return errors.length > 0 ? errors : null;
    }
}

interface FactoryOptions {
    [name:string]: unknown;
}

interface FactorySchema {
    [name:string]: FactoryOptions;
}

export const GenericValidatorFactory = {
    _validatorFactory(name: string, options: FactoryOptions) {
        if (name.toUpperCase() === 'FORCEDGENERAL') {
            const opts = options as {general: string, mustInclude:undefined|boolean};
            const mustInclude = opts.mustInclude === undefined ? true : opts.mustInclude;
            return new ForcedGeneralValidator(opts.general, mustInclude);
        }
        else if (name.toUpperCase() === 'MUSTBEINCLUDED') {
            const opts = options as {units: []};
            return new MustBeIncludedValidator(opts.units);
        }
        return new NoRorValidator;
    },
    createValidator(schema: FactorySchema) {
        const names = Object.getOwnPropertyNames(schema);
        if (names.length === 0)
            return this._validatorFactory('', {});

        if (names.length === 1)
            return this._validatorFactory(names[0], schema[names[0]]);

        const validators: ArmyValidator[] = [];
        names.forEach(name => {
            const validatorStep = this._validatorFactory(name, schema[name]);
            validators.push(validatorStep);
        });
        return new MultiStepValidator(validators);
    }
}

export const armyValidatorCollection = new ArmyValidatorCollection;

interface ValidatorJson {
    [name: string]: FactorySchema;
}

export const registerJsonValidators = (path: string) => {
    const json = fs.readFileSync(path);
    const data = JSON.parse(json.toString()) as ValidatorJson;
    const entries = Object.getOwnPropertyNames(data);
    entries.forEach(aorName => {
        const validator = GenericValidatorFactory.createValidator(data[aorName]);
        armyValidatorCollection.add(aorName, validator);
    });
}