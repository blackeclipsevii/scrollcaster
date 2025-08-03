
import Army from "../../../Army.js";
import Roster from "../../../Roster.js";
import { armyValidatorCollection, ArmyValidator, mustBeYourGeneral, noRegimentOfRenown, noFactionTerrain } from "../ArmyValidator.js";

class ScionsOfNulahmiaValidator implements ArmyValidator {
    validate(army: Army, roster: Roster): string[] | null {
        const name = 'Sekhar, Fang of Nulahmia';
        let errors: string[] = [];
        let err = mustBeYourGeneral(name, roster.regiments, true);
        if (err) errors = errors.concat(err);

        err = noRegimentOfRenown(roster);
        if (err) errors = errors.concat(err);
        
        return errors.length > 0 ? errors : null;
    }
};

class KnightsOfTheCrimsonKeep implements ArmyValidator {
    validate(army: Army, roster: Roster): string[] | null {
        const name = 'Prince Vhordrai';
        let errors: string[] = [];
        let err = mustBeYourGeneral(name, roster.regiments, false);
        if (err) errors = errors.concat(err);

        err = noRegimentOfRenown(roster);
        if (err) errors = errors.concat(err);

        err = noFactionTerrain(roster);
        if (err) errors = errors.concat(err);
        
        return errors.length > 0 ? errors : null;
    }
};

class BarrowLegion implements ArmyValidator {
    validate(army: Army, roster: Roster): string[] | null {
        return noRegimentOfRenown(roster);
    }
};

export const registerSoulblightValidators = () => {
    armyValidatorCollection.add('Barrow Legion', new BarrowLegion);
    armyValidatorCollection.add('Knights of the Crimson Keep', new KnightsOfTheCrimsonKeep);
    armyValidatorCollection.add('Scions of Nulahmia', new ScionsOfNulahmiaValidator);
}