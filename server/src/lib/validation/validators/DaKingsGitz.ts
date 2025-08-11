
import Army from "../../../Army.js";
import Roster from "../../../Roster.js";
import Unit from "../../../Unit.js";
import { armyValidatorCollection, ForcedGeneralValidator, processName } from "../ArmyValidator.js";

class DaKingsGitzValidator extends ForcedGeneralValidator {
    constructor() {
        super('Skragrott, the Loonking', true);
    }
    namesEqual = (a:string | null, b:string | null) => {
        if (a === null || b === null)
            return false;
        const left = processName(a);
        const right = processName(b);
        return left === right;
    }
    validate(army: Army, roster: Roster): string[] | null {
        const errors: string[] = super.validate(army, roster) || [];
        
        const hero = 'HERO';
        const troggoth = 'TROGGOTH';
        let nTrog = 0;
        let triggerHeroErr = false;
        let triggerTrogError = false;

        const testUnit = (unit: Unit) => {
            if (unit.keywords.includes(troggoth)) {
                if (unit.keywords.includes(hero)) {
                    triggerHeroErr = true;
                } else {
                    ++ nTrog;
                    triggerTrogError = nTrog > 2;
                }
            }
        }

        roster.regiments.every(reg => {
            if (reg.leader)
                testUnit(reg.leader);
            reg.units.forEach(unit => {
                testUnit(unit);
            });

            // quit if we've hit all the errors
            return !(triggerHeroErr && triggerTrogError);
        });

        roster.auxiliaryUnits.every(unit => {
            testUnit(unit);

            // quit if we've hit all the errors
            return !(triggerHeroErr && triggerTrogError);
        });

        if (triggerHeroErr)
            errors.push(`Only non-<${hero}> <${troggoth}> can be added.`);
        
        if (triggerTrogError)
            errors.push(`Only 0-2 non-<${hero}> <${troggoth}> units can be added.`);

        return errors.length > 0 ? errors : null;
    }
};

export const registerDaKingsGitz = () => {
    armyValidatorCollection.add(`Da King's Gitz`, new DaKingsGitzValidator);
}