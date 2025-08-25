
import Army from "../../../Army.js";
import Roster from "../../../Roster.js";
import Unit from "../../../Unit.js";
import { armyValidatorCollection, NoRorValidator, processName } from "../ArmyValidator.js";

class WardensOfTheChorrileumValidator extends NoRorValidator {
    nameStartsWith = (a:string | null, b:string | null) => {
        if (a === null || b === null)
            return false;
        const left = processName(a);
        const right = processName(b);
        return left.startsWith(right);
    }
    validate(army: Army, roster: Roster): string[] | null {
        const errors: string[] = super.validate(army, roster) || [];
        
        let nEidolon = 0;

        const testUnit = (unit: Unit) => {
            if (this.nameStartsWith(unit.name, 'Eidolon of Mathlann'))
                ++ nEidolon;
        }

        roster.regiments.forEach(reg => {
            if (reg.leader)
                testUnit(reg.leader);

            reg.units.forEach(unit => {
                testUnit(unit);
            });
        });

        roster.auxiliaryUnits.forEach(unit => {
            testUnit(unit);
        });

        if (nEidolon === 0) {
            errors.push(`Either <Eidolon of Mathlann, Aspect of the Sea> or <Eidolon of Mathlann, Aspect of the Storm> must be included. No more than 1 can be included`);
        } else if (nEidolon > 1) {
            errors.push(`Only <Eidolon of Mathlann, Aspect of the Sea> or <Eidolon of Mathlann, Aspect of the Storm> can be included. No more than 1 can be included`)
        }

        return errors.length > 0 ? errors : null;
    }
};

export const registerWardensOfTheChorrileum = () => {
    armyValidatorCollection.add(`Wardens of the Chorrileum`, new WardensOfTheChorrileumValidator);
}