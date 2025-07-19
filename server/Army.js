
import Unit from './Unit.js';
import Upgrade from './Upgrade.js'
import { UpgradeType } from "../shared/UpgradeType.js";
import BsConstraint, { BsCondition, BsModifier, ModifierType, Scope } from './lib/BsConstraint.js';
import BsAttrObj from './lib/BsAttribObj.js';

const LeaderId = "d1f3-921c-b403-1106";

const upgradeLUT = {
    'battle formation': {
        alias: 'battleFormations',
        type: UpgradeType.BattleFormation
    },
    'battle traits': {
        alias: 'battleTraits',
        type: UpgradeType.BattleTraits
    },
    'artefact': {
        alias: 'artefacts',
        type: UpgradeType.Artifact
    },
    'heroic trait': {
        alias: 'heroicTraits',
        type: UpgradeType.HeroicTrait
    },
    'manifestation lore': {
        alias: 'manifestation',
        type: UpgradeType.ManifestationLore
    },
    'spell lore': {
        alias: 'spell',
        type: UpgradeType.SpellLore
    },
    'prayer lore': {
        alias: 'prayer',
        type: UpgradeType.PrayerLore
    }
};

export default class Army {
    constructor(ageOfSigmar, armyName) {
        this.name = armyName;
        this.upgrades = {
            artefacts: {},
            battleFormations: {},
            battleTraits: {},
            heroicTraits: {},
            lores: {
                manifestation: {},
                spell: {},
                prayer: {}
            }
        };
        this.points = {};
        this.units = {};
        this.unitLUT = {};
        this.keywordLUT = {};
        this.regimentsOfRenown = [];
        this._tags = {};
        // TO-DO what about big waaagh!s
        this.isArmyOfRenown = armyName.includes(' - ') && !armyName.includes('Library');
        this._parse(ageOfSigmar, armyName);
    }

    _availableUnits(ageOfSigmar, catalogue, entryLink) {
        if (!entryLink.modifiers)
            return;

        const targetId = entryLink['@targetId'];
        const unit = this.units[targetId];
        if (!unit)
            return;

        let isLeader = false;
        entryLink.modifiers.forEach(modifier => {
            if (modifier['@type'] === 'set-primary')
                isLeader = true;
        });

        if (!isLeader)
            return;

        // TO-DO not sure how to parse these correctly
        const regimentOptions = {
            constraints: {},
            units: [],
            keywords: [],
            _tags: []
        };

        if (catalogue.categoryEntries) {
            catalogue.categoryEntries.forEach(catEntry => {
                if (!catEntry.constraints) {
                    // console.log(`Skipping catalog entry ${catEntry['@name']} - no constraints`);
                    return;
                }
                let constraints = {};
                catEntry.constraints.forEach(constraintXml => {
                    const cObj = new BsConstraint(constraintXml);
                    constraints[cObj.id] = cObj;
                });

                catEntry.modifiers.forEach(modXml =>{
                    const mObj = new BsModifier(modXml);
                    let meetsConditions = false;

                    modXml.conditionGroups.forEach(condGroup =>{
                        condGroup.localConditionGroups.forEach(lcg => {
                            let localMeetsCondition = true;
                            // TO-DO correctly local condition group
                            lcg.conditions.forEach(conditionXml =>{
                                const condObj = new BsCondition(conditionXml);
                                if (condObj.childId === LeaderId)
                                    return;
                                localMeetsCondition &= condObj.meetsCondition(entryLink);
                            });

                            if (localMeetsCondition) {
                                console.log(`${entryLink['@name']} meets conditions for ${catEntry['@name']}`);
                                meetsConditions = true;
                            }
                        });
                    });

                    if (meetsConditions) {
                        const constraint = constraints[mObj.field];
                        constraint.applyModifier(mObj);
                        let myConstraints = regimentOptions.constraints[catEntry['@id']];
                        if (!myConstraints) {
                            myConstraints = {
                                name: catEntry['@name']
                            };
                            regimentOptions.constraints[entryLink['@id']] = myConstraints;
                        }
                        myConstraints[constraint.type] = constraint.value;
                    }
                });
            });
        }

        const getLUTID = (modifier) => {
            const recursiveStr = 'self.entries.recursive.';
            const lutId = modifier['@affects'];
            if (lutId.startsWith(recursiveStr))
                return lutId.substring(recursiveStr.length);
            return lutId;
        }

        if (entryLink.modifierGroups) {
            entryLink.modifierGroups.forEach(group => {
                if (group['@type'] === 'and') {
                    group.modifiers.forEach(modifier => {
                        if (modifier['@type'] === ModifierType.add &&
                            modifier['@scope'] === Scope.force) {
                            const lutId = getLUTID(modifier);
                            const childId = this.unitLUT[lutId];
                            const childUnit = this.units[this.unitLUT[lutId]];
                            if (childUnit) {
                                regimentOptions.units.push(childId);
                            } else {
                                let keyword = ageOfSigmar.keywordLUT[lutId];
                                if (keyword) {
                                    regimentOptions.keywords.push(keyword);
                                } else {
                                    keyword = this.keywordLUT[lutId];
                                    if (keyword) {
                                        regimentOptions._tags.push(keyword);
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }

        if (regimentOptions.units.length > 0 ||
            regimentOptions.keywords.length > 0 ||
            regimentOptions._tags.length > 0)
            unit.regimentOptions = regimentOptions;
    }

    _parse(ageOfSigmar, armyName) {
        const data = ageOfSigmar._database.armies[armyName];
        const catalogue = data.catalog;
        this.id = catalogue['@id'];

        const _libraryUnits = {};

        // read all the units out of the libraries
        const names = Object.getOwnPropertyNames(data.libraries);
        names.forEach(name => {
            data.libraries[name].sharedSelectionEntries.forEach(entry => {
                if (entry['@type'] === 'unit') {
                    const unit = new Unit(entry);
                    _libraryUnits[unit.id] = unit;
                }
            });
        })
        
        if (catalogue.categoryEntries) {
            catalogue.categoryEntries.forEach(category => {
                this.keywordLUT[category['@id']] = category['@name'];
            });
        }

        const ulKeys = Object.getOwnPropertyNames(upgradeLUT);

        const addUpgrade = (upgrades, key, element) => {
            const lu = upgradeLUT[key];
            let upgrade = null
            if (lu.type === UpgradeType.ManifestationLore ||
                lu.type === UpgradeType.SpellLore ||
                lu.type === UpgradeType.PrayerLore) {
                const targetId = element.entryLinks[0]['@targetId'];
                if (targetId) {
                    upgrade = ageOfSigmar.lores.lores[lu.alias][targetId];
                    if (upgrade && upgrade.unitIds) {
                        upgrade.unitIds.forEach(uuid => {
                            const unit = _libraryUnits[uuid];
                            if (!unit) {
                                console.log(`WARNING: Unable to find unit link in library: ${uuid}`);
                                return;
                            }
                            this.units[uuid] = unit;
                        });
                    }
                }
            }

            if (!upgrade) {
                upgrade = new Upgrade(element, lu.type);
            }

            if (key.includes('lore'))
                upgrades.lores[lu.alias][upgrade.name] = upgrade;
            else
                upgrades[lu.alias][upgrade.name] = upgrade;
        }

        catalogue.sharedSelectionEntries.forEach(entry => {
            const lc = entry['@name'].toLowerCase();
            if (entry['@type'] === 'unit') {
                const unit = new Unit(entry);
                _libraryUnits[unit.id] = unit;
            } else {
                ulKeys.forEach(key => {
                    if (lc.includes(key)) {
                        // console.log(entry, null, 2);
                        addUpgrade(this.upgrades, key, entry);
                    }
                });
            }
        })

        // update the capabilities of each unit
        catalogue.entryLinks.forEach(link => {
            // this is the global library for the faction
            let unit = _libraryUnits[link['@targetId']];
            if (!unit) {
                console.log (`unable to find unitid: ${link['@targetId']}`);
                console.log(`name :${link['@name']}`);
                return;
            }

            // these are the units this army can use
            this.units[unit.id] = unit;
            this.unitLUT[link['@id']] = unit.id;

            if (link.entryLinks) {
                link.entryLinks.forEach(ele => {
                    const lc = ele['@name'].toLowerCase();
                    if (lc.includes('trait')) {
                        unit.canHaveHeroicTrait = true;
                        return;
                    }
                    if (lc.includes('artefact')) {
                        unit.canHaveArtefact = true;
                        return;
                    }
                    if (lc.includes('warlord')) {
                        unit.canBeGeneral = true;
                        return;
                    }
                    if (lc.includes('reinforced')) {
                        unit.canBeReinforced = true;
                        return;
                    }
                });
            }
            if (link.costs){
                link.costs.forEach(cost => {
                    if (cost['@name'] === 'pts') {
                        unit.points = Number(cost['@value']);
                    }
                });
            }

            if (link.modifierGroups) {
                link.modifierGroups.forEach(group => {
                    if (group['@type'] === 'and' && group.modifiers) {
                        group.modifiers.forEach(modifier => {
                            if (modifier['@type'] === 'add' && 
                                modifier['@field'] === 'category' &&
                                modifier['@value'] && 
                                !modifier['@scope']) {
                                const keyword = this.keywordLUT[modifier['@value']];
                                if (keyword) {
                                    // the keywords isn't technically on the warscroll
                                    console.log(`${unit.name} tag added : ${keyword}`);
                                    unit._tags.push(keyword);
                                }
                            }
                        });
                    }
                });
            }
        });

        // need the lut setup
        catalogue.entryLinks.forEach(link => {
            this._availableUnits(ageOfSigmar, catalogue, link);
        });
        
        catalogue.sharedSelectionEntryGroups.forEach(entry => {
            const lc = entry['@name'].toLowerCase();
            ulKeys.forEach(key => {
                if (lc.includes(key)) {
                    // console.log(entry, null, 2);
                    if (entry.selectionEntryGroups) {
                        entry.selectionEntryGroups.forEach(group => {
                            group.selectionEntries.forEach(element => {
                                addUpgrade(this.upgrades, key, element);
                            });
                        });
                    } else {
                        entry.selectionEntries.forEach(element => {
                            addUpgrade(this.upgrades, key, element);
                        });
                    }
                }
            });

            ageOfSigmar.lores.universal.forEach(itr => {
                const universalLore = ageOfSigmar.lores.lores.manifestation[itr.id];
                universalLore.points = itr.points;
                universalLore.type = itr.type;
                this.upgrades.lores.manifestation[`UNIVERSAL-${universalLore.name}`] = universalLore;
            });
        });

        // get this armies regiments
        // to-do maybe this can be an endpoint that we only present if asked
        const rorIds = Object.getOwnPropertyNames(ageOfSigmar.regimentsOfRenown);
        rorIds.forEach(rorId => {
            const ror = ageOfSigmar.regimentsOfRenown[rorId];
            ror.selectableIn.forEach(id => {
                const name = ageOfSigmar._database.armyLUT[id];
                if (armyName === name) {
                    this.regimentsOfRenown.push(ror);
                }
            });
        });

        // sort the units by type
        // this.units.sort((a, b) => a.type - b.type);
    }
}