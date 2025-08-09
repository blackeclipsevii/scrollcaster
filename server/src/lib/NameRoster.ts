import AgeOfSigmar from "../AgeOfSigmar.js";
import Roster, { Regiment } from "../Roster.js";
import Unit from "../Unit.js";
import Upgrade from "../Upgrade.js";

import { UpgradeLUT } from "../../../shared-lib/UpgradeInterface.js";
import { NameRoster, NameUnit } from "../../../shared-lib/NameRoster.js";
import { LoreLUTInterf } from "../../../shared-lib/LoreInterface.js";

export const nameRosterToRoster = (ageOfSigmar: AgeOfSigmar, nameRoster: NameRoster) => {
    const army = ageOfSigmar.getArmy(nameRoster.armyName);
    if (!army)
        return null;
    const roster = new Roster(army);
    roster.name = nameRoster.name;
    roster.points = 2000;

    const namesEqual = (a:string | null, b:string | null) => {
        if (a === null || b === null)
            return false;
        const left = a.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
        const right = b.toLocaleLowerCase().replace(/[^a-z0-9]/g, '');
        return left === right;
    }

    const units = Object.values(army.units);
    const findUnit = (name: string) => {
        let result: Unit | null = null;
        units.every(unit => {
            if (namesEqual(unit.name, name)) {
                result = unit;
                return false;
            }
            return true;
        })
        return result;
    }

    const findUpgradeByName = (name: string | null, ugLUT: UpgradeLUT | LoreLUTInterf) => {
        const upgrades = Object.values(ugLUT);
        if (name === null)
            return null;
        let result = null;
        upgrades.every(upgrade => {
            if (namesEqual(upgrade.name, name)) {
                result = upgrade;
                return false;
            }
            return true;
        });
        return result;
    }

    if (nameRoster.battleFormation) {
        roster.battleFormation = findUpgradeByName(nameRoster.battleFormation, army.upgrades.battleFormations);
    }

    if (nameRoster.battleTacticCards.length > 0) {
        nameRoster.battleTacticCards.forEach(tactic => {
            ageOfSigmar.battleTacticCards.every(aosBtc => {
                if (namesEqual(aosBtc.name, tactic)) {
                    roster.battleTacticCards.push(aosBtc);
                    return false;
                }
                return true;
            })
        });
    }

    if (roster.lores.canHaveSpell && nameRoster.lores.spell) {
        roster.lores.spell = findUpgradeByName(nameRoster.lores.spell, army.upgrades.lores.spell);
    }

    if (roster.lores.canHavePrayer && nameRoster.lores.prayer) {
        roster.lores.prayer = findUpgradeByName(nameRoster.lores.prayer, army.upgrades.lores.prayer);
    }
    
    if (roster.lores.canHaveManifestation && nameRoster.lores.manifestation) {
        roster.lores.manifestation = findUpgradeByName(nameRoster.lores.manifestation, army.upgrades.lores.manifestation);
    }

    if (nameRoster.factionTerrain) {
        roster.terrainFeature = findUnit(nameRoster.factionTerrain);
    }

    if (nameRoster.regimentOfRenown) {
        army.regimentsOfRenown.every(force => {
            if (namesEqual(nameRoster.regimentOfRenown, force.name)) {
                roster.regimentOfRenown = force;
                return false;
            }
            return true;
        });
    }

    const nameUnitToUnit = (nameUnit: NameUnit) => {
        const unit: Unit | null = findUnit(nameUnit.name);
        if (!unit)
            return null;

        const findUpgrade = (name: string, upgradeLut: UpgradeLUT): Upgrade | null => {
            let result: Upgrade | null = null;
            const upgrades = Object.values(upgradeLut);
            upgrades.every(ug => {
                if (ug.name === name) {
                    result = ug;
                    return false;
                }
                return true;
            });
            return result;
        }

        const clone = JSON.parse(JSON.stringify(unit)) as Unit;
        clone.isGeneral = nameUnit.isGeneral;
        clone.isReinforced = nameUnit.isReinforced;
        nameUnit.other.forEach(otherName => {
            // check the option sets
            let checkNext = clone.optionSets.every(set => {
                const options = Object.values(set.options);
                return options.every(option => {
                    if (option.name === otherName) {
                        set.selection = option;
                        return false;
                    }
                    return true;
                });
            });

            if (checkNext) {
                checkNext = clone.models.every(model => {
                    return model.optionSets.every(set => {
                        const options = Object.values(set.options);
                        return options.every(option => {
                            if (option.name === otherName) {
                                set.selection = option;
                                return false;
                            }
                            return true;
                        });
                    })
                });
            }

            // check the enhancements
            if (checkNext) {
                const enhancementNames = Object.getOwnPropertyNames(clone.enhancements);
                enhancementNames.every(eName => {
                    const armyEnhanceGroup = army.upgrades.enhancements[eName];
                    if (!armyEnhanceGroup)
                        return true;

                    const upgrade = findUpgrade(otherName, armyEnhanceGroup.upgrades);
                    if (upgrade) {
                        clone.enhancements[eName].slot = upgrade;
                        return false;
                    }

                    return true;
                });
            }
        });
        return clone;
    }

    nameRoster.regiments.forEach(nameReg => {
        const regiment: Regiment = {
            leader: null,
            units: []
        };
        nameReg.forEach((nameUnit, index) => {
            const unit = nameUnitToUnit(nameUnit);
            if (unit) {
                if (index === 0)
                    regiment.leader = unit;
                else
                    regiment.units.push(unit);
            }
        });
        if (regiment.leader || regiment.units.length > 0)
            roster.regiments.push(regiment);
    });

    nameRoster.auxUnits.forEach(nameUnit => {
        const auxUnit = nameUnitToUnit(nameUnit);
        if (auxUnit) {
            roster.auxiliaryUnits.push(auxUnit);
        }
    });

    return roster;
}
