
import Army from "../../../Army.js";
import Roster from "../../../Roster.js";
import { armyValidatorCollection, ArmyValidator, noRegimentOfRenown, noFactionTerrain } from "../ArmyValidator.js";

class BigWaaaghValidator implements ArmyValidator {
    validate(army: Army, roster: Roster): string[] | null {
        let errors: string[] = [];
        let err = noRegimentOfRenown(roster);
        if (err) errors = errors.concat(err);

        err = noFactionTerrain(roster);
        if (err) errors = errors.concat(err);

        const ironjawz = 'IRONJAWZ';
        let nIronjawz = 0;

        const kruelboyz = 'KRULEBOYZ';
        let nKruelboyz = 0;

        let wildcard = false;
        roster.regiments.forEach(reg => {
            let keyword = '';
            if (reg.leader) {
                if (reg.leader.name.startsWith('Kragnos')) {
                    if (reg.units.length === 0) {
                        wildcard = true;
                    } else {
                        if (reg.units[0].keywords.includes(ironjawz)) {
                            keyword = ironjawz
                        } else {
                            keyword = kruelboyz;
                        }
                    }
                }
                else if (reg.leader.keywords.includes(ironjawz)) {
                    keyword = ironjawz;
                }
                else if (reg.leader.keywords.includes(kruelboyz)) {
                    keyword = kruelboyz;
                }
            }

            if (keyword.length > 0) {
                if (keyword === ironjawz) {
                    ++ nIronjawz;
                } else {
                    ++ nKruelboyz;
                }

                const errs: string[] = [];
                reg.units.forEach(unit => {
                    if(!unit.keywords.includes(keyword)) {
                        if (errs.length === 0 && reg.leader?.name.includes('Kragnos')) {
                            errs.push(`Kragnos can only include units with either the <${ironjawz}> or <${kruelboyz}> faction keyword, but not both.`);
                        }
                        const err = `<${unit.name}> does not have the <${keyword}> faction keyword required by <${reg.leader?.name}>'s regiment.`;
                        errs.push(err);
                    }
                });
                if (errs.length > 0)
                    errors = errors.concat(errs);
            }
        });

        // kragnos isn't leading anybody, make him count for the faction
        // with less regiments if possible
        if (wildcard) {
            if (nKruelboyz !== nIronjawz) {
                if (nKruelboyz < nIronjawz)
                    nKruelboyz++;
                else
                    nIronjawz ++;
            } else {
                nIronjawz ++;
            }
        }

        if (nKruelboyz !== nIronjawz) {
            errors.push(`The number of <${ironjawz}> (<${nIronjawz}>) and <${kruelboyz}> (<${nKruelboyz}>) regiments must be equal.`);
        }
        
        return errors.length > 0 ? errors : null;
    }
};

export const registerBigWaaagh = () => {
    armyValidatorCollection.add('Big Waaagh!', new BigWaaaghValidator);
}