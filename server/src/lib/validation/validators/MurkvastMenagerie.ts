
import Army from "../../../Army.js";
import Roster from "../../../Roster.js";
import Unit from "../../../Unit.js";
import { armyValidatorCollection, ForcedGeneralValidator, noFactionTerrain, processName} from "../ArmyValidator.js";

class MurkvastMenagerieValidator extends ForcedGeneralValidator {
    constructor() {
        super('Swampboss Skumdrekk', true);
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
        
        const errs = noFactionTerrain(roster);
        if (errs && errs.length > 0)
            errors = errors.concat(errs);

        const hero = 'HERO';
        const kruleboyz = 'KRULEBOYZ';
        const monster = 'MONSTER';
        const infantry = 'INFANTRY';
        const shamanAndPotGrot = 'Swampcalla Shaman and Pot-grot';

        let nKruleboyzHeroMonsters = 0;
        let nShamanAndPotGrot = 0;
        let nInfantryUnit = 0;

        const tallyUnit = (unit: Unit) => {
            // mark hoow many kruleboyz hero monster we have
            if (unit.keywords.includes(hero) &&
                unit.keywords.includes(monster)) {
                ++nKruleboyzHeroMonsters
                return;
            }

            if (this.namesEqual(unit.name, shamanAndPotGrot)) {
                ++nShamanAndPotGrot;
                return;
            }

            if (unit.keywords.includes(infantry) &&
                !unit.keywords.includes(hero)) {
                ++nInfantryUnit;
            }
        }

        roster.regiments.forEach(reg => {
            if (reg.leader) {
                tallyUnit(reg.leader);
            }

            reg.units.forEach(unit =>{
                tallyUnit(unit);
            });
        });

        roster.auxiliaryUnits.forEach(unit =>{
            tallyUnit(unit);
        });

        if (nShamanAndPotGrot > nKruleboyzHeroMonsters) {
            errors.push(`The number of <${shamanAndPotGrot}> units exceeds the number of <${kruleboyz}> <${hero}> <${monster}> units.`)
        }

        if (nInfantryUnit > nKruleboyzHeroMonsters) {
            errors.push(`The number of non-<${hero}> <${infantry}> units exceeds the number of <${kruleboyz}> <${hero}> <${monster}> units.`)
        }

        return errors.length > 0 ? errors : null;
    }
};

export const registerMurkvastMenagerie = () => {
    armyValidatorCollection.add(`Murkvast Menagerie`, new MurkvastMenagerieValidator);
}