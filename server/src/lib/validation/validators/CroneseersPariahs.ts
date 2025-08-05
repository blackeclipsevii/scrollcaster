
import Army from "../../../Army.js";
import Roster from "../../../Roster.js";
import Unit from "../../../Unit.js";
import { armyValidatorCollection, ForcedGeneralValidator, processName } from "../ArmyValidator.js";

class TheCroneseersPariahsValidator extends ForcedGeneralValidator {
    constructor() {
        super('Krethusa the Croneseer', true);
    }
    namesEqual = (a:string | null, b:string | null) => {
        if (a === null || b === null)
            return false;
        const left = processName(a);
        const right = processName(b);
        return left === right;
    }
    validate(army: Army, roster: Roster): string[] | null {
        let errors: string[] = super.validate(army, roster) || [];
        
        const excludeList = [
            processName('Morathi-Khaine'),
            processName('The Shadow Queen')
        ];

        const genericError = 'cannot include <Morathi-Khaine> or <The Shadow Queen>';
        
        const checkName = (unit: Unit) => {
            let name = processName(unit.name);
            if (excludeList.includes(name)) {
                errors.push(genericError);
                return false;
            }
            return true;
        }

        roster.regiments.every(reg => {
            if (reg.leader) {
                if (!checkName(reg.leader))
                    return false;
            }
            for (let i = 0; i < reg.units.length; ++i) {
                if (!checkName(reg.units[i]))
                    return false;
            }
            return true;
        });

        roster.auxiliaryUnits.every(unit => {
            return checkName(unit);
        });

        return errors.length > 0 ? errors : null;
    }
};

export const registerCroneseersPariahs = () => {
    armyValidatorCollection.add(`The Croneseer's Pariahs`, new TheCroneseersPariahsValidator);
}