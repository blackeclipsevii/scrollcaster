import AgeOfSigmar from "../AgeOfSigmar.js";
import { UpgradeLUT } from "../Army.js";
import Roster, { Regiment } from "../Roster.js";
import Unit from "../Unit.js";
import Upgrade from "../Upgrade.js";

// Name based representation of a unit
// Used for import from various list formats
export interface NameUnit {
    name: string;
    isGeneral: boolean;
    isReinforced: boolean;
    artefact: string | null;
    heroicTrait: string | null;
    monstrousTrait: string | null;
    other: string[];
};

// Name based representation of a roster
// Used for import from various list formats
export interface NameRoster {
    name: string;
    armyName: string;
    battleFormation: string | null;
    battleTacticCards: string[];
    lores: {
        [name: string]: string | null;
    };
    factionTerrain: string | null;
    regiments: (NameUnit[])[];
    auxUnits: NameUnit[];
};

export const nameRosterToRoster = (ageOfSigmar: AgeOfSigmar, nameRoster: NameRoster) => {
    const army = ageOfSigmar.getArmy(nameRoster.armyName);
    if (!army)
        return null;
    const roster = new Roster(army);
    roster.name = nameRoster.name;
    roster.points = 2000;

    const units = Object.values(army.units);
    const findUnit = (name: string) => {
        let result: Unit | null = null;
        units.every(unit => {
            if (unit.name === name) {
                result = unit;
                return false;
            }
            return true;
        })
        return result;
    }

    if (nameRoster.battleFormation) {
        const formations = Object.values(army.upgrades.battleFormations);
        roster.battleFormation = formations.filter(formation => {
            return formation.name === nameRoster.battleFormation;
        })[0];
    }
    if (nameRoster.battleTacticCards.length > 0) {
        nameRoster.battleTacticCards.forEach(tactic => {
            ageOfSigmar.battleTacticCards.every(aosBtc => {
                if (aosBtc.name === tactic) {
                    roster.battleTacticCards.push(aosBtc);
                    return false;
                }
                return true;
            })
        });
    }
    if (roster.lores.canHaveSpell && nameRoster.lores.spell) {
        const spells = Object.values(army.upgrades.lores.spell);
        roster.lores.spell = spells.filter(spell => {
            return spell.name === nameRoster.lores.spell;
        })[0];
    }
    if (roster.lores.canHavePrayer && nameRoster.lores.prayer) {
        const prayers = Object.values(army.upgrades.lores.prayer);
        roster.lores.prayer = prayers.filter(prayer => {
            return prayer.name === nameRoster.lores.prayer;
        })[0];
    }
    if (roster.lores.canHaveManifestation && nameRoster.lores.manifestation) {
        const manifestations = Object.values(army.upgrades.lores.manifestation);
        roster.lores.manifestation = manifestations.filter(manifestation => {
            return manifestation.name === nameRoster.lores.manifestation;
        })[0];
    }
    if (nameRoster.factionTerrain) {
        roster.terrainFeature = findUnit(nameRoster.factionTerrain);
    }

    const nameUnitToUnit = (nameUnit: NameUnit) => {
        const unit: Unit | null = findUnit(nameUnit.name);
        if (!unit)
            return null;

        const findUpgrade = (name: string, upgradeLut: UpgradeLUT) => {
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
        if (nameUnit.artefact) {
            clone.artefact = findUpgrade(nameUnit.artefact, army.upgrades.artefacts);
        }
        if (nameUnit.monstrousTrait) {
            clone.monstrousTraits = findUpgrade(nameUnit.monstrousTrait, army.upgrades.monstrousTraits);
        }
        if (nameUnit.heroicTrait) {
            clone.heroicTrait = findUpgrade(nameUnit.heroicTrait, army.upgrades.heroicTraits);
        }
        nameUnit.other.forEach(otherName => {
            clone.optionSets.forEach(set => {
                const options = Object.values(set.options);
                options.every(option => {
                    if (option.name === otherName) {
                        set.selection = option;
                        return false;
                    }
                    return true;
                });
            });
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
