import { RegimentState, RosterStateInterf, serializeRoster, UnitState } from "../../../../shared-lib/State.js";
import { ArmyUpgrades } from "../../../../shared-lib/ArmyUpgrades.js";
import BattleTacticCardInterf from "../../../../shared-lib/BattleTacticCardInterf.js";
import UnitInterf from "../../../../shared-lib/UnitInterface.js";
import { RegimentInterf } from "../../../../shared-lib/RosterInterface.js";
import { Force } from "../../../../shared-lib/Force.js";
import { getNewRoster } from "../../RestAPI/roster.js";
import { generateId } from "../uniqueIdentifier.js";
import { fetchUpgrades } from "../../RestAPI/upgrades.js";
import { fetchTactics } from "../../RestAPI/tactics.js";
import { unitsApi } from "../../RestAPI/units.js";
import { fetchRegimentsOfRenown } from "../../RestAPI/regimentsOfRenown.js";

export const rosterState = {
    serialize: serializeRoster,
    async deserialize(json: string, id: string | null = null) {
        const state = JSON.parse(json) as RosterStateInterf;

        const roster = await getNewRoster(state.army);
        roster.id = id ? id : generateId();
        roster.name = state.name;
        roster.army = state.army;
        
        const upgradePool = await fetchUpgrades(state.army) as ArmyUpgrades | null;
        if (!upgradePool) {
            return null;
        }
        
        if (state.battleFormation) {
            const values = Object.values(upgradePool.battleFormations);
            values.every(value => {
                if (value.id === state.battleFormation) {
                    roster.battleFormation = value;
                    return false;
                }
                return true;
            });
        }

        if (state.battleTacticCards) {
            const btcPool = await fetchTactics() as BattleTacticCardInterf[] | null;
            if (btcPool) {
                btcPool.forEach(tactic => {
                    if (state.battleTacticCards.includes(tactic.id)) {
                        roster.battleTacticCards.push(tactic);
                    }
                });
            }
        }

        const unitPool = await unitsApi.get(state.army) as {[name:string]: UnitInterf};
        if (!unitPool) {
            return null;
        }
        
        const lores = ['spell', 'prayer', 'manifestation'];
        lores.forEach(lore => {
            const values = Object.values(upgradePool.lores[lore]);
            values.every(value => {
                if (value.id === state.lores[lore]) {
                    roster.lores[lore] = value;
                    return false;
                }
                return true;
            });
        })
        
        const deserializeUnit = (state: UnitState): UnitInterf | null => {
            const poolUnit = unitPool[state.unit] as UnitInterf | null;
            if (!poolUnit)
                return null;
            
            // copy the unit so we can modify it
            const unit = JSON.parse(JSON.stringify(poolUnit)) as UnitInterf;
            unit.isGeneral = state.isGeneral;
            unit.isReinforced = state.isReinforced;

            const enhanceNames = Object.getOwnPropertyNames(poolUnit.enhancements);
            enhanceNames.forEach(eName => {
                if (state.enhancements[eName]) {
                    const enhancementGroup = upgradePool.enhancements[eName];
                    if (enhancementGroup) {
                        const enhancements = Object.values(enhancementGroup.upgrades);
                        enhancements.every(enhance => {
                            if (enhance.id === state.enhancements[eName]) {
                                unit.enhancements[eName].slot = enhance;
                                return false;
                            }
                            return true;
                        });
                    }
                }
            });

            if (unit.optionSets) {
                unit.optionSets.forEach(optionSet => {
                    const selection = state.options[optionSet.name];
                    if (selection) {
                        optionSet.selection = optionSet.options[selection];
                    }
                })
            }

            if (unit.models) {
                unit.models.forEach(model => {
                    const stateModel = state.models[model.id];
                    if (stateModel) {
                        model.optionSets.forEach(optionSet => {
                            const selection = stateModel.options[optionSet.name];
                            if (selection) {
                                optionSet.selection = optionSet.options[selection];
                            }
                        });
                    }
                });
            } 
            return unit;
        };

        state.regiments.forEach((regState: RegimentState) => {
            // update 8/7 to have leader
            const regiment: RegimentInterf = {
                leader: null,
                units: []
            };

            if (regState.leader)
                regiment.leader = deserializeUnit(regState.leader);

            regState.units.forEach((unitState, i) => {
                const unit = deserializeUnit(unitState);
                if (unit) {
                    regiment.units.push(unit);
                }
            });
            if (regiment.leader || regiment.units.length > 0) {
                roster.regiments.push(regiment);
            }
        });

        state.auxUnits.forEach(unitState => {
            const unit = deserializeUnit(unitState);
            if (unit) {
                roster.auxiliaryUnits.push(unit);
            }
        });
        
        if (state.regimentOfRenown) {
            const ror = await fetchRegimentsOfRenown(state.army) as Force[] | null;
            if (ror) {
                ror.every(reg => {
                    if (reg.id === state.regimentOfRenown) {
                        roster.regimentOfRenown = reg;
                        return false;
                    }
                    return true;
                });
            }
        }

        if (state.terrainFeature) {
            roster.terrainFeature = unitPool[state.terrainFeature];
        }

        return roster;
    }
};