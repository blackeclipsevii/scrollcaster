
import Army from "../../../Army.js";
import Roster from "../../../Roster.js";
import Unit from "../../../Unit.js";
import { armyValidatorCollection, NoRorValidator, processName } from "../ArmyValidator.js";

class PyrofaneCultValidator extends NoRorValidator {
    namesEqual = (a:string | null, b:string | null) => {
        if (a === null || b === null)
            return false;
        const left = processName(a);
        const right = processName(b);
        return left === right;
    }
    validate(army: Army, roster: Roster): string[] | null {
        let errors: string[] = super.validate(army, roster) || [];
        
        let nGauntSummoner = 0;
        let triggerErr = true;

        const testUnit = (unit: Unit) => {
            if (this.namesEqual(unit.name, 'Gaunt Summoner') ||
                this.namesEqual(unit.name, 'Gaunt Summoner on Disc of Tzeentch')) {
                ++ nGauntSummoner;
                if (nGauntSummoner > 1 && triggerErr) {
                    triggerErr = false;
                    errors.push(`Only 0-1 <Gaunt Summoner> or <Gaunt Summoner on Disc of Tzeentch> allowed.`);
                }
            }
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

        return errors.length > 0 ? errors : null;
    }
};

export const registerPyrofaneCult = () => {
    armyValidatorCollection.add(`Pyrofane Cult`, new PyrofaneCultValidator);
}