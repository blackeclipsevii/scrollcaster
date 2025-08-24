import AgeOfSigmar from "../AgeOfSigmar.js";
import Roster, { Regiment } from "../Roster.js";
import Unit from "../Unit.js";
import Upgrade from "../Upgrade.js";

import UpgradeInterf, { UpgradeLUT } from "@scrollcaster/shared-lib/UpgradeInterface.js";
import { NameRoster, NameUnit } from "@scrollcaster/shared-lib/NameRoster.js";
import LoreInterf, { LoreLUTInterf } from "@scrollcaster/shared-lib/LoreInterface.js";
import { UnitType } from "@scrollcaster/shared-lib/UnitInterface.js";
import { WeaponSelectionInterf } from "@scrollcaster/shared-lib/WeaponInterf.js";
import { namesEqual } from "./helperFunctions.js";

// official app does orruks different
const translateArmyName = (unknownName: string, battleFormation: string): {name: string, formation: string} | null => {
    unknownName = unknownName.toLowerCase();
    const lcBf = battleFormation.toLowerCase();
    if (unknownName.includes('big waaagh')) {
        return {
            name: 'Ironjawz',
            formation: 'Big Waaagh!'
        }
    }

    if (unknownName.includes('orruk warclans')) {
        if (lcBf.includes('krazogg') || lcBf.includes('zoggrok')) {
            return {
                name: 'Ironjawz',
                formation: lcBf
            }
        }
        if (lcBf.includes('murkvast')) {
            return {
                name: 'Kruleboyz',
                formation: lcBf
            }
        }
    }

    return null;
}

export const nameRosterToRoster = (ageOfSigmar: AgeOfSigmar, nameRoster: NameRoster) => {
    let army = ageOfSigmar.findArmy(nameRoster.armyName, nameRoster.battleFormation);
    if (!army) {
        const translation = translateArmyName(nameRoster.armyName,
                                nameRoster.battleFormation ? nameRoster.battleFormation : '');
        if (!translation)
            return;

        nameRoster.armyName = translation.name;
        nameRoster.battleFormation = translation.formation;
        army = ageOfSigmar.findArmy(nameRoster.armyName, nameRoster.battleFormation);
        if (!army)
            return;
    }
    const roster = new Roster(army);
    roster.name = nameRoster.name;
    roster.points = 2000;

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
        if (name === null)
            return null;

        const upgrades = Object.values(ugLUT) as (UpgradeInterf | LoreInterf)[];
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
                if (namesEqual(ug.name, name)) {
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
        
        // 2x Moonstone Hammer
        function startsWithNumberX(str: string) {
            return /^[0-9]+x\b/.test(str);
        }

        // Moonstone Hammer
        function getWeaponName(str: string) {
            const match = str.match(/^[0-9]+x\s*(.+)/);
            return match ? match[1] : null;
        }

        // 2
        function getQuantity(str: string) {
            const match = str.match(/^([0-9]+)x/);
            return match ? parseInt(match[1], 10) : null;
        }

        nameUnit.other.forEach(otherName => {
            let checkNext = true;

            if (startsWithNumberX(otherName)) {
                // its probably a weapon
                const weaponName = getWeaponName(otherName);
                const quantity = getQuantity(otherName);
                if (weaponName && quantity) {
                    clone.models.forEach(model => {
                        const selections = Object.values(model.weapons.selections);
                        const selection = selections.find((value: WeaponSelectionInterf) => namesEqual(value.name, weaponName));
                        if (selection) {
                            checkNext = false;
                            model.weapons.selected[weaponName] = quantity;
                        }
                    });             
                }
            }

            // check the option sets
            if (checkNext) {
                checkNext = clone.optionSets.every(set => {
                    const options = Object.values(set.options);
                    return options.every(option => {
                        if (namesEqual(option.name, otherName)) {
                            set.selection = option;
                            return false;
                        }
                        return true;
                    });
                });
            }

            if (checkNext) {
                checkNext = clone.models.every(model => {
                    return model.optionSets.every(set => {
                        const options = Object.values(set.options);
                        return options.every(option => {
                            if (namesEqual(option.name, otherName)) {
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
                if (index === 0 && unit.type == UnitType.Hero)
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
