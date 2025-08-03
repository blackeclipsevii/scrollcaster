const rosterState = {
    lores: ['spell', 'prayer', 'manifestation'],
    serialize(roster) {
        const state = {}
        state.name = roster.name;
        state.army = roster.army; // not id?
        if (roster.battleFormation)
            state.battleFormation = roster.battleFormation.id;
        
        state.regiments = [];
        state.regimentOfRenown = null;

        const serializeUnit = (unit) => {
            const unitState = {};
            unitState.unit = unit.id;
            unitState.isGeneral = unit.isGeneral;
            unitState.isReinforced = unit.isReinforced;
            const enhancements = ['artefact', 'heroicTrait', 'monstrousTrait'];
            enhancements.forEach(enhancement => {
                unitState[enhancement] = unit[enhancement] ? unit[enhancement].id : null;
            });
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

        state.battleTacticCards = [];
        roster.battleTacticCards.forEach(card => {
            state.battleTacticCards.push(card.id);
        });

        state.auxUnits = [];
        roster.auxiliaryUnits.forEach(unit => {
            state.auxUnits.push(serializeUnit(unit));
        });

        state.lores = {
            spell: null,
            prayer: null,
            manifestation: null
        }

        this.lores.forEach(lore => {
            if (roster.lores[lore])
                state.lores[lore] = roster.lores[lore].id;
        });

        if (roster.regimentOfRenown) {
            state.regimentOfRenown = roster.regimentOfRenown.id;
        }

        roster.regiments.forEach((regiment)=> {
            // update this 8/7 to have dedicated leader
            const regState = { leader: null, units: [] };
            if (regiment.leader) {
                regState.leader = serializeUnit(regiment.leader);
            }
            regiment.units.forEach(unit => {
                regState.units.push(serializeUnit(unit));
            });
            if (regState.units.length > 0 || regState.leader)
                state.regiments.push(regState);
        });

        return JSON.stringify(state);
    },
    async deserialize(json, id=null) {
        const state = JSON.parse(json);

        const roster = await getNewRoster(state.army);
        roster.id = id ? id : generateId();
        roster.name = state.name;
        roster.army = state.army;

        const fetchRegimentsOfRenown = async (armyName) => {
            const url = `${endpoint}/regimentsOfRenown?army=${armyName}`;
            return await fetchWithLoadingDisplay(encodeURI(url));
        };
        const fetchUpgrades = async (armyName) => {
            return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/upgrades?army=${armyName}`));
        };

        const fetchTactics = async () => {
            return await fetchWithLoadingDisplay(encodeURI(`${endpoint}/tactics`));
        };
        
        const upgradePool = await fetchUpgrades(state.army);
        
        if (state.battleFormation)
            roster.battleFormation = upgradePool.battleFormations[state.battleFormation];

        if (state.battleTacticCards) {
            const btcPool = await fetchTactics();
            state.battleTacticCards.forEach(tacticId => {
                const btc = btcPool[tacticId];
                if (btc)
                    roster.battleTacticCards.push(btc);
            });
        }

        const unitPool = await unitsApi.get(state.army);
        
        const lores = ['spell', 'prayer', 'manifestation'];
        lores.forEach(lore => {
            if (state.lores[lore]) {
                roster.lores[lore] = upgradePool.lores[lore][state.lores[lore]];
            }
        })
        
        const deserializeUnit = (state) => {
            const unit = unitPool[state.unit];
            if (!unit)
                return;
            
            unit.isGeneral = state.isGeneral;
            unit.isReinforced = state.isReinforced;
            const enhancements = ['artefact', 'heroicTrait', 'monstrousTrait'];
            enhancements.forEach(enhancement => {
                if (state[enhancement]) {
                    const pool = upgradePool[`${enhancement}s`];
                    unit[enhancement] = pool[state[enhancement]];
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
            return unit;
        };

        state.regiments.forEach((regState) => {
            // update 8/7 to have leader
            const regiment = {
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
            const ror = await fetchRegimentsOfRenown(state.army);
            roster.regimentOfRenown = ror[state.regimentOfRenown];
        }

        return roster;
    }
};