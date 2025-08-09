
import RosterInterf, { RegimentInterf } from "../../../shared-lib/RosterInterface.js";
import { RegimentState, RosterStateInterf, serializeRoster, UnitState } from "../../../shared-lib/State.js";
import UnitInterf from "../../../shared-lib/UnitInterface.js";
import AgeOfSigmar from "../AgeOfSigmar.js";
import Army from "../Army.js";
import Roster from "../Roster.js";

export const deserializeUnit = (army: Army, state: UnitState) => {
    const armyUnit: UnitInterf | null = army.units[state.unit];
    if (!armyUnit)
        return;
    
    // we're modifying the unit, clone it
    const unit = JSON.parse(JSON.stringify(armyUnit)) as UnitInterf;
    unit.isGeneral = state.isGeneral ? true : false;
    unit.isReinforced = state.isReinforced ? true : false;

    const enhancementNames = Object.getOwnPropertyNames(unit.enhancements);
    enhancementNames.forEach(eName => {
        if (state.enhancements[eName]) {
            const enhanceGroup = army.upgrades.enhancements[eName];
            if (enhanceGroup) {
                const upgrades = Object.values(enhanceGroup.upgrades);
                upgrades.every(upgrade => {
                    if (upgrade.id === state.enhancements[eName]) {
                        unit.enhancements[eName].slot = upgrade;
                        return false;
                    }
                    return true;
                });
            }
        }
    });

    if (unit.optionSets && state.options) {
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

export const deserializeRegiment = (army: Army, regState: RegimentState) => {
    const regiment: RegimentInterf = {
        leader: null,
        units: []
    };
    if (regState.leader) {
        const leader = deserializeUnit(army, regState.leader);
        if (leader)
            regiment.leader = leader;
    }
    regState.units.forEach((unitState: UnitState, i: number) => {
        const unit = deserializeUnit(army, unitState);
        if (unit) {
            regiment.units.push(unit);
        }
    });
    return regiment;
}

export const RosterState = {
    serialize: serializeRoster,
    deserialize: (ageOfSigmar: AgeOfSigmar, json: string | RosterStateInterf, id=null) => {
        let state = null;
        if (typeof json === 'string')
            state = JSON.parse(json);
        else
            state = json;

        const army = ageOfSigmar.getArmy(state.army);
        if (!army){
            console.log(`Unable to deserialize state: army ${state.army} not found`);
            return null;
        };

        const roster = new Roster(army) as RosterInterf;
        roster.id = id ? id : '';
        roster.name = state.name;
        roster.army = state.army;
        
        if (state.battleFormation)
            roster.battleFormation = army.upgrades.battleFormations[state.battleFormation];

        if (state.battleTacticCards) {
            roster.battleTacticCards = ageOfSigmar.battleTacticCards.filter((card) => {
                return state.battleTacticCards.includes((card.id));
            })
        }

        if (state.lores.spell)
            roster.lores.spell = army.upgrades.lores.spell[state.lores.spell];

        if (state.lores.prayer)
            roster.lores.prayer = army.upgrades.lores.spell[state.lores.prayer];
        
        if (state.lores.manifestation)
            roster.lores.manifestation = army.upgrades.lores.spell[state.lores.manifestation];

        if (state.terrainFeature) {
            roster.terrainFeature = army.units[state.terrainFeature];
        }

        state.regiments.forEach((regState: RegimentState) => {
            const regiment = deserializeRegiment(army, regState);
            if (regiment.leader || regiment.units.length > 0) {
                roster.regiments.push(regiment);
            }
        });

        state.auxUnits.forEach((unitState: UnitState) => {
            const unit = deserializeUnit(army, unitState);
            if (unit) {
                roster.auxiliaryUnits.push(unit);
            }
        });
        
        if (state.regimentOfRenown) {
            for (let i = 0; i < army.regimentsOfRenown.length; ++i){
                if (army.regimentsOfRenown[i].id === state.regimentOfRenown) {
                    roster.regimentOfRenown = army.regimentsOfRenown[i];
                    break;
                }
            }
        }

        return roster;
    }
};