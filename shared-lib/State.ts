import RosterInterf, { RegimentInterf } from "./RosterInterface.js";
import UnitInterf from "./UnitInterface.js";

export interface ModelState {
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
                options: {}
            }
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

export const serializeRoster = (roster: RosterInterf) => {
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
};