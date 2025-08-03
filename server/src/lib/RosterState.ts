import AgeOfSigmar from "../AgeOfSigmar.js";
import Army from "../Army.js";
import Roster, { Regiment } from "../Roster.js";
import Unit from "../Unit.js";

export interface UnitState {
    unit: string;
    isGeneral: boolean;
    isReinforced: boolean;
    artefact: string|null;
    heroicTrait: string|null;
    monstrousTrait: string|null;
    options: {[name:string]: string};
}

export const serializeUnit = (unit: Unit) => {
    const unitState: UnitState = {
        unit: unit.id,
        isGeneral: unit.isGeneral,
        isReinforced: unit.isReinforced,
        artefact: null,
        heroicTrait: null,
        monstrousTrait: null,
        options: {}
    };
    const enhancements = ['artefact', 'heroicTrait', 'monstrousTraits'];
    unitState.artefact = unit.artefact ? unit.artefact.id : null;
    unitState.heroicTrait = unit.heroicTrait ? unit.heroicTrait.id : null;
    unitState.monstrousTrait = unit.monstrousTraits ? unit.monstrousTraits.id : null;
    unitState.options = {};
    if (unit.optionSets) {
        unit.optionSets.forEach(optionSet => {
            if (optionSet.selection) {
                unitState.options[optionSet.name] = optionSet.selection.name;
            }
        })
    }
    return unitState;
};

export const serializeRegiment = (regiment: Regiment) => {
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

export const deserializeUnit = (army: Army, state: UnitState) => {
    const unit: Unit | null = army.units[state.unit];
    if (!unit)
        return;
    
    unit.isGeneral = state.isGeneral ? true : false;
    unit.isReinforced = state.isReinforced ? true : false;
    unit.artefact = state.artefact ? army.upgrades.artefacts[state.artefact] : null;
    unit.heroicTrait = state.heroicTrait ? army.upgrades.heroicTraits[state.heroicTrait] : null;
    unit.monstrousTraits = state.monstrousTrait ? army.upgrades.monstrousTraits[state.monstrousTrait] : null;
    
    if (unit.optionSets && state.options) {
        unit.optionSets.forEach(optionSet => {
            const selection = state.options[optionSet.name];
            if (selection) {
                optionSet.selection = optionSet.options[selection];
            }
        })
    }
    return unit;
};

export const deserializeRegiment = (army: Army, regState: RegimentState) => {
    const regiment: Regiment = {
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

interface RegimentState {
    leader: UnitState | null,
    units: UnitState[];
}

interface LoresState {
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
}

export const RosterState = {
    serialize: (roster: Roster) => {
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
            }
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

        roster.regiments.forEach((regiment: Regiment)=> {
            const regState = serializeRegiment(regiment);
            if (regState.units.length > 0)
                state.regiments.push(regState);
        });

        return JSON.stringify(state);
    },

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

        const roster = new Roster(army);
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