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
        state.terrainFeature = null;

        const serializeUnit = (unit) => {
            const unitState = {
                unit: unit.id,
                isGeneral: unit.isGeneral,
                isReinforced: unit.isReinforced,
                enhancements: {},
                options: {}
            };

            if (Object.getOwnPropertyNames(unit).includes('heroicTrait')) {
                // old unit format
                unitState.enhancements['artefactsOfPower'] = unit.artefact ? unit.artefact.id : null;
                unitState.enhancements['heroicTraits'] = unit.heroicTrait ? unit.heroicTrait.id : null;
                unitState.enhancements['monstrousTraits'] = unit.monstrousTrait ? unit.monstrousTrait.id : null;
            } else {
                const enhanceNames = Object.getOwnPropertyNames(unit.enhancements);
                enhanceNames.forEach(enhanceName => {
                    const enhance = unit.enhancements[enhanceName];
                    unitState.enhancements[enhanceName] = enhance.slot ? enhance.slot.id : null;
                });
            }

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

        if (roster.terrainFeature) {
            state.terrainFeature = roster.terrainFeature.id;
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
        
        const upgradePool = await fetchUpgrades(state.army);
        
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
            const btcPool = await fetchTactics();
            btcPool.forEach(tactic => {
                if (state.battleTacticCards.includes(tactic.id)) {
                    roster.battleTacticCards.push(tactic);
                }
            });
        }

        const unitPool = await unitsApi.get(state.army);
        
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
        
        const deserializeUnit = (state) => {
            const poolUnit = unitPool[state.unit];
            if (!poolUnit)
                return;
            
            // copy the unit so we can modify it
            const unit = JSON.parse(JSON.stringify(poolUnit));
            unit.isGeneral = state.isGeneral;
            unit.isReinforced = state.isReinforced;

            const enhanceNames = Object.getOwnPropertyNames(poolUnit.enhancements);
            enhanceNames.forEach(eName => {
                if (state.enhancements[eName]) {
                    const enhancementGroup = upgradePool.enhancements[eName];
                    const enhancements = Object.values(enhancementGroup.upgrades);
                    enhancements.every(enhance => {
                        if (enhance.id === state.enhancements[eName]) {
                            unit.enhancements[eName].slot = enhance;
                            return false;
                        }
                        return true;
                    })
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
            ror.every(reg => {
                if (reg.id === state.regimentOfRenown) {
                    roster.regimentOfRenown = reg;
                    return false;
                }
                return true;
            })
        }

        if (state.terrainFeature) {
            roster.terrainFeature = unitPool[state.terrainFeature];
        }

        return roster;
    }
};