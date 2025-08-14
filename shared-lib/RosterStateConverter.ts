import RosterInterf, { RegimentInterf } from "./RosterInterface.js";
import UnitInterf from "./UnitInterface.js";
import { ArmyUpgrades } from "./ArmyUpgrades.js";
import BattleTacticCardInterf from "./BattleTacticCardInterf.js";
import { Force } from "./Force.js";
import LoreInterf from "./LoreInterface.js";

export interface ModelState {
    weapons: {[name:string]: number | null};
    options: {[name:string]: string | null};
}

export interface UnitState {
    unit: string;
    isGeneral: boolean;
    isReinforced: boolean;
    enhancements: {[name: string]: string | null};
    options: {[name:string]: string | null};
    models: {[name:string]: ModelState};
}

export interface RegimentState {
    leader: UnitState | null,
    units: UnitState[];
}

export interface LoresState {
    [name: string]: string|null;
    spell: string | null;
    prayer: string | null;
    manifestation: string | null;
}

export interface RosterStateInterf {
    name: string;
    army: string;
    regimentOfRenown: string | null;
    battleFormation: string | null;
    regiments: RegimentState[];
    battleTacticCards: string[]
    auxUnits: UnitState[];
    lores: LoresState;
    terrainFeature: string | null;
}

export const serializeUnit = (unit: UnitInterf) => {
    const unitState: UnitState = {
        unit: unit.id,
        isGeneral: unit.isGeneral,
        isReinforced: unit.isReinforced,
        enhancements: {},
        options: {},
        models: {}
    };

    // these ifs are for backwards compatibility and can be removed in september

    if (unit.enhancements) { // eslint-disable-line
        const enhancementNames = Object.getOwnPropertyNames(unit.enhancements);
        enhancementNames.forEach(eName => {
            if (unit.enhancements[eName].slot) {
                unitState.enhancements[eName] = unit.enhancements[eName].slot.id;
            }
        });
    }

    if (unit.optionSets) { // eslint-disable-line
        unit.optionSets.forEach(optionSet => {
            if (optionSet.selection) {
                unitState.options[optionSet.name] = optionSet.selection.name;
            }
        });
    }

    if (unit.models) { // eslint-disable-line
        unit.models.forEach(model => {
            const modelState: ModelState = {
                weapons: {},
                options: {}
            }
            const weaponNames = Object.getOwnPropertyNames(model.weapons.selected);
            weaponNames.forEach(weaponName => {
                const quantity = model.weapons.selected[weaponName];
                if (quantity > 0) {
                    modelState.weapons[weaponName] = quantity;
                }
            });
            model.optionSets.forEach(optionSet => {
                if (optionSet.selection) {
                    modelState.options[optionSet.name] = optionSet.selection.name;
                }
            });
            unitState.models[model.id] = modelState;
        });
    }

    return unitState;
};

export const serializeRegiment = (regiment: RegimentInterf) => {
    // update this 8/7 to have dedicated leader
    const regState: RegimentState = { leader: null, units: [] };
    if (regiment.leader) {
        regState.leader = serializeUnit(regiment.leader);
    }
    regiment.units.forEach(unit => {
        regState.units.push(serializeUnit(unit));
    });
    return regState;
}

export interface UnitPool {
    [id: string]: UnitInterf | undefined | null
}

export const deserializeRoster = (roster: RosterInterf,
                     unitPool: UnitPool,
                     upgradePool: ArmyUpgrades,
                     battleTacticCards: BattleTacticCardInterf[],
                     regimentsOfRenown: Force[],
                     state: RosterStateInterf,
                     id: string | null = null) => {
    roster.id = id ? id : '';
    roster.name = state.name;
    roster.army = state.army;
    
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
        battleTacticCards.forEach(tactic => {
            if (state.battleTacticCards.includes(tactic.id)) {
                roster.battleTacticCards.push(tactic);
            }
        });
    }
    
    const lores = ['spell', 'prayer', 'manifestation'];
    lores.forEach(lore => {
        const values = Object.values(upgradePool.lores[lore]);
        values.every(value => {
            if (value.id === state.lores[lore]) {
                (roster.lores as unknown as {[name: string]: LoreInterf})[lore] = value;
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
                 
                const weaponSelections = Object.values(model.weapons.selections);
                weaponSelections.forEach(weaponSelection => {
                    if (stateModel.weapons[weaponSelection.name]) {
                        const quantity = stateModel.weapons[weaponSelection.name];
                        if (quantity !== null && quantity !== undefined)
                            model.weapons.selected[weaponSelection.name] = quantity;
                    }
                });
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
        regimentsOfRenown.every(reg => {
            if (reg.id === state.regimentOfRenown) {
                roster.regimentOfRenown = reg;
                return false;
            }
            return true;
        });
    }

    if (state.terrainFeature) {
        const tf = unitPool[state.terrainFeature];
        if (tf)
            roster.terrainFeature = tf;
    }

    return roster;
}

export default class RosterStateConverter {
    serialize = (roster: RosterInterf) => {
        const state: RosterStateInterf = { 
            name: roster.name,
            army: roster.army,
            auxUnits: [],
            regimentOfRenown: null,
            battleFormation: null,
            regiments: [],
            battleTacticCards: [],
            lores: {
                spell: null,
                prayer: null,
                manifestation: null
            },
            terrainFeature: null
        }

        if (roster.battleFormation)
            state.battleFormation = roster.battleFormation.id;
        
        roster.battleTacticCards.forEach(card => {
            state.battleTacticCards.push(card.id);
        });

        roster.auxiliaryUnits.forEach(unit => {
            state.auxUnits.push(serializeUnit(unit));
        });

        if (roster.lores.spell)
            state.lores.spell = roster.lores.spell.id;

        if (roster.lores.prayer)
            state.lores.prayer = roster.lores.prayer.id;

        if (roster.lores.manifestation)
            state.lores.manifestation = roster.lores.manifestation.id;

        if (roster.regimentOfRenown) {
            state.regimentOfRenown = roster.regimentOfRenown.id;
        }

        if (roster.terrainFeature) {
            state.terrainFeature = roster.terrainFeature.id;
        }

        roster.regiments.forEach((regiment: RegimentInterf)=> {
            const regState = serializeRegiment(regiment);
            if (regState.units.length > 0 || regState.leader)
                state.regiments.push(regState);
        });

        return JSON.stringify(state);
    }

    async getUnitPool(armyName: string): Promise<UnitPool | null> {
         return null;
    }
    
    async getUpgradePool(armyName: string): Promise<ArmyUpgrades | null> {
        return null;
    }

    async getNewRoster(armyName: string): Promise<RosterInterf | null> {
        return null;
    }

    async getTactics(): Promise<BattleTacticCardInterf[] | null> {
        return null;
    }

    async getRegimentsOfRenown(armyName: string): Promise<Force[] | null> {
        return null;
    }

    async deserialize(json: string | RosterStateInterf, id: string) {
        let state: RosterStateInterf;
        if (typeof json === 'string')
            state = JSON.parse(json) as RosterStateInterf;
        else
            state = json;
        
        const upgradePool = await this.getUpgradePool(state.army);
        if (!upgradePool) {
            return null;
        }

        const unitPool = await this.getUnitPool(state.army);
        if (!unitPool) {
            return null;
        }

        const roster = await this.getNewRoster(state.army);
        if (!roster) {
            return null;
        }
        
        const btcPool = (await this.getTactics()) || ([] as BattleTacticCardInterf[])
        const ror = (await this.getRegimentsOfRenown(state.army)) || ([] as Force[]);

        return deserializeRoster(roster, unitPool, upgradePool, btcPool, ror, state, id);
    }
};