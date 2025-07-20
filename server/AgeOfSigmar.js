
import Lores from './Lores.js';
import Army from './Army.js';
import BattleTacticCard from './BattleTacticCard.js';
import Unit from './Unit.js';

import { bsLayoutSmoother } from './lib/BsSmoother.js';

import fs from 'fs';
import { XMLParser, XMLValidator} from "fast-xml-parser";
import parseCatalog from './lib/parseCatalog.js';

import path from 'path';
import Upgrade from './Upgrade.js';
import { UpgradeType } from '../shared/UpgradeType.js';
import BsConstraint, { Scope, BsModifier, ConstraintType, getConstraints } from './lib/BsConstraint.js';

function parseGameSystem(path) {
    const xmlContent = fs.readFileSync(path, 'utf8');
    const options = {
        ignoreAttributes: false,
        attributeNamePrefix : "@",
        allowBooleanAttributes: true
    };
    
    const result = XMLValidator.validate(xmlContent, options);
    if (!result)
        return null;

    const parser = new XMLParser(options);
    let root = parser.parse(xmlContent);
    root = bsLayoutSmoother(root);
    return root.gameSystem;
}

export default class AgeOfSigmar {
    constructor(path) {
        this._database = {
            path: path,
            armyLUT: {},
            armies: {}
        }
        this.regimentsOfRenown = null;
        this.lores = new Lores(path);

        this.gameSystem = parseGameSystem(`${path}/Age of Sigmar 4.0.gst`);

        this._populateLibraries(path);
        this.battleTacticCards = [];
        this.units = {};

        this.keywordLUT = {};
        this._parseKeywords();
        this._parseBattleProfiles();
    }

    getArmyNames() {
        const names = Object.getOwnPropertyNames(this._database.armies);
        return names.filter(name => {
            const lc = name.toLowerCase();
            return !(lc.includes('regiments of renown') || lc.includes('[legends]'));
        });
    }

    getArmy(armyName) {
        const data = this._database.armies[armyName];
        // if it isn't parsed, it doesn't exist
        if (!data)
            return null;

        if (data.army)
            return data.army;

        data.army = new Army(this, armyName);
        return data.army;
    }

    // get all the units available to a leader's regiment
    getRegimentOptions(army, leaderId) {
        const leader = army.units[leaderId];
        if (!leader) {
            console.log(`where are you ${leaderId}`)
            return;
        }
        // aos keywords
        let keywords = Object.values(this.keywordLUT);
        // army keywords
        keywords.join(Object.values(army.keywordLUT));

        const sortKeywords = (inKeywords) => {
            return inKeywords.sort((a, b) => {
                const countSpaces = str => (str.match(/ /g) || []).length;

                const spaceDiff = countSpaces(a) - countSpaces(b);
                if (spaceDiff !== 0) return spaceDiff;

                // Same number of spaces — longer string goes first
                return b.length - a.length;
            });
        }

        const hasNonPrefix = (haystack, needle) => {
            const index = haystack.indexOf(needle);
            if (index === -1) 
                return false; // needle not found

            if (haystack.length < (needle.length + 4))
                return false;

            // Check if the 4 characters before the needle are 'non-'
            return haystack.slice(index - 4, index) === 'non-';
        }

        console.log(`${leader.name} ${leader.battleProfile}`);
        const options = leader.battleProfile.regimentOptions.toUpperCase().split(',');

        // sort on spaces so we don't hit any keywords that match substrings of other keywords
        // longer keywords also take presidence
        //const sortedKeywords = sortKeywords(keywords);
        const canFieldUnit = (unit) => {
            let allTags = unit._tags;    
            allTags.push(unit.name);

            // only look at every keyword if it's not a hero
            if (unit.type !== 0) {
                allTags = allTags.concat(unit.keywords);
            }

            // normalize on uppercase and sort
            allTags = sortKeywords(allTags.join(',').toUpperCase().split(','));
            const requiredStr = '(REQUIRED)';
            let ok = false;
            options.forEach(option => {
                if (ok) return ok;

                option = option.trim();
                const subOptions = [];

                if (option.includes(requiredStr)) {
                    option = option.replace(requiredStr, '').trim();
                    subOptions.push(option);
                } else {
                    // any, 0-1, etc
                    // qualifier shouldn't matter here were not verifying the regiment
                    // just reducing the number of units available for selection
                    const qualifier = option.split(' ')[0];
                    option = option.substring(qualifier.length).trim()
                    if (option.includes(' or ')){
                        subOptions.concat(option.split(' or '));
                    } else {
                        subOptions.push(option);
                    }
                }
                allTags.forEach(tag => {
                    subOptions.forEach(so => {
                        if (so.includes(tag)) {
                            ok = !hasNonPrefix(so, tag);
                        }
                    })
                });
            });

            return ok;
        }

        let units = [];
        const armyUnits = Object.values(army.units);
        armyUnits.forEach(unit => {
            if (canFieldUnit(unit)) {
                units.push(unit);
            }
        });
        return units;
    }

    _loadRegimentsOfRenown(rorData) {
        const motherloadOfUnits = {};
        const names = Object.getOwnPropertyNames(rorData.libraries);
        names.forEach(name => {
            rorData.libraries[name].sharedSelectionEntries.forEach(entry => {
                if (entry['@type'] === 'unit') {
                    const unit = new Unit(entry);
                    motherloadOfUnits[unit.id] = unit;
                }
            });
        });

        // the forces
        const ghb2526id = 'f079-501a-2738-6845';
        const regiment = '376a-6b97-8699-dd59';
        const aux = '4063-b3a6-e7e1-383f';
        const parsedForces = {};
        this.gameSystem.forceEntries.forEach(gsForceEntry => {
            if (gsForceEntry['@id'] === ghb2526id) {
                gsForceEntry.forceEntries.forEach(forceEntry => {
                    // skip these
                    if (forceEntry['@id'] === regiment || forceEntry['@id'] === aux) {
                        return;
                    }

                    // we want special stuff
                    const force = {};
                    force.selectableIn = [];
                    force.id = forceEntry['@id'];
                    force.name = forceEntry['@name'];
                    force.unitContainers = [];
                    force.upgrades = [];
                    
                    // where do i put it
                    forceEntry.modifiers.forEach(modifier => {
                        if (modifier['@type'] === "set") {
                            modifier.conditionGroups.forEach(cgParent => {
                                // this should be a group pairing AOS with the other parents
                                cgParent.conditionGroups.forEach(cgArmies => {
                                    cgArmies.conditions.forEach(condition => {
                                        if (condition['@type'] === 'instanceOf' &&
                                            condition['@field'] === 'selections' &&
                                            condition['@scope'] === 'parent') {
                                            force.selectableIn.push(condition['@childId']);
                                        }
                                        
                                    });
                                });
                            });
                        }
                    });

                    forceEntry.costs.forEach(cost => {
                        if (cost['@name'] === 'pts') {
                            force.points = Number(cost['@value']);
                        }
                    });

                    parsedForces[forceEntry['@id']] = force;
                });
            }
        });
        
        rorData.catalog.entryLinks.forEach(entryLink => {
            const targetId = entryLink['@targetId'];

            if (!entryLink.modifierGroups) {
                console.log(`ugh missing modifier groups?! ${entryLink['@name']} ${entryLink['@id']}`)
                return;
            }

            const myConstraints = getConstraints(entryLink);

            // this is probably wildly overkill as most (all?) ror are fixed in size
            entryLink.modifierGroups.forEach(modGroup => {
                
                modGroup.modifiers.forEach(mod => {
                    const cObj = myConstraints.constraints[mod['@field']];
                    if (cObj) {
                        const mObj = new BsModifier(mod);
                        cObj.applyModifier(mObj);
                    }
                });

                modGroup.conditions.forEach(condition => {
                    if (condition['@type'] === 'instanceOf' &&
                        condition['@field'] === 'selections' &&
                        condition['@scope'] === 'force') {

                        const unit = motherloadOfUnits[targetId];
                        if (!unit) {
                            console.log(`woah buddy your unit is missing from the motherload: ${targetId}`);
                            return;
                        }

                        const obj = {
                            unit : unit,
                            min : 0,
                            max : 0
                        };

                        myConstraints.LUT.forEach(id => {
                            const constraint = myConstraints.constraints[id];
                            if (constraint.type === ConstraintType.min) {
                                obj.min = Number(constraint.value);
                            } else if (constraint.type === ConstraintType.max) {
                                obj.max = Number(constraint.value);
                            } else {
                                console.log(`WARNING: constraint not honored: ${constraint.type}`);
                            }
                        });

                        const forceId = condition['@childId'];
                        const force = parsedForces[forceId];
                        if (!force) {
                            console.log(`force not found when loading ror units: ${forceId}`);
                            return;
                        }
                        force.unitContainers.push(obj);
                    }
                })
            });
        });

        // libraries have been populated already
        // the ror abilities
        rorData.catalog.sharedSelectionEntries.forEach(entry => {
            if (entry['@type'] === 'upgrade') {
                const upgrade = new Upgrade(entry, UpgradeType.RegimentOfRenown);
                entry.modifiers.forEach(mod => {
                    mod.conditions.forEach(condition => {
                        if (condition['@field'] === 'selections' &&
                            condition['@scope'] === 'roster') {
                            const childId = condition['@childId'];
                            const force = parsedForces[childId];
                            if (!force) {
                                console.log(`upgrade missing its force? ${upgrade.id} ${upgrade.name}`);
                                return;
                            }
                            force.upgrades.push(upgrade);
                        }
                    });
                })
            }
        });

        // aos can see them all TO-DO maybe overkill
        this.regimentsOfRenown = parsedForces;
    }

    _parseBattleProfiles() {
        // relative to server.js
        const profileDir = './server/resources/battle profiles';
        const profileFiles = fs.readdirSync(profileDir);
        const armyCatNames = Object.getOwnPropertyNames(this._database.armies);
        // populate the armies and seperate the libraries
        profileFiles.forEach(file => {
            const lc = file.toLowerCase();
            console.log(lc);

            if (path.extname(lc) === '.json') {
                const json = fs.readFileSync(path.join(profileDir, file));
                const profileList = JSON.parse(json);
                const profiles = {};
                profileList.forEach(profile => {
                    profiles[profile.name] = profile;
                });
                const armyName = file.replace('.json','').trim();
                armyCatNames.forEach(armyCatName => {
                    if (armyCatName.trim().toLowerCase().startsWith((armyName.toLowerCase()))) {
                        console.log(`adding battle profile to ${armyCatName}`)
                        this._database.armies[armyCatName].battleProfiles = profiles;
                    }
                });
            }
        });
    }

    _populateLibraries(dir) {
        const catFiles = fs.readdirSync(dir);
        const libraries = {}
        let rorData = null;
        // populate the armies and seperate the libraries
        catFiles.forEach(file => {
            const lc = file.toLowerCase();
            console.log(lc);

            if (path.extname(lc) === '.cat') {
                const fullPath = `${dir}/${file}`;
                const data = parseCatalog(fullPath);
                if (data) {
                    const isCatalog = data['@library'] !== "true";
                    if (isCatalog) {
                        if ((rorData === null) && data['@name'].includes('Regiments of Renown')) {
                            rorData = {
                                catalog: data,
                                battleProfiles: null,
                                librariesLUT: {},
                                libraries: {}
                            };
                        } else {
                            this._database.armyLUT[data['@id']] = data['@name'];
                            this._database.armies[data['@name']] = {
                                catalog: data,
                                battleProfiles: null,
                                librariesLUT: {},
                                libraries: {},
                                army: null
                            }
                        }
                        
                    } 
                    else  {
                        libraries[data['@id']] = data;
                    }
                }
            }
        });

        const attachLibraries = (data) => {
            data.catalog.catalogueLinks.forEach(link => {
                const name = link['@name'].toLowerCase();
                // lores we handle seperately
                // don't tackle narrative right now
                if (!name.includes(' lores') &&
                    !name.includes('path to glory')) {
                    const targetId = link['@targetId'];
                    const library = libraries[targetId];
                    if (library) {
                        data.libraries[link['@name']] = library;
                        data.librariesLUT[targetId] = link['@name'];
                    }
                }
            });
        }

        // now attach the libraries to their armies
        const armyIds = Object.getOwnPropertyNames(this._database.armies);
        armyIds.forEach(armyName => {
            const data = this._database.armies[armyName];
            attachLibraries(data);
        });

        attachLibraries(rorData);

        this._loadRegimentsOfRenown(rorData);
    }

    _parseKeywords() {
        if (!this.gameSystem)
            return;

        // get a lut for keywords
        this.gameSystem.categoryEntries.forEach(entry => {
            this.keywordLUT[entry['@id']] = entry['@name'];
        });

        this.gameSystem.selectionEntries.forEach(entry => {
            if (entry['@name'] === 'Battle Tactic Cards') {
                entry.selectionEntryGroups.forEach(group => {
                    group.selectionEntries.forEach(tacticEntry => {
                        const btCard = new BattleTacticCard(tacticEntry);
                        this.battleTacticCards.push(btCard);
                    });
                });
            }
            if (entry['@type'] === 'unit') {
                const unit = new Unit(entry);
                console.log(`${unit.name} ${unit.id}`);
                this.units[unit.id] = unit;
            }
        });

        
        this.gameSystem.sharedSelectionEntries.forEach(entry => {
            if (entry['@type'] === 'unit') {
                const unit = new Unit(entry);
                console.log(`${unit.name} ${unit.id}`);
                this.units[unit.id] = unit;
            }
        });
    }
}