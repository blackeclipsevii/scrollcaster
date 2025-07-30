
import Lores from './Lores.js';
import Army from './Army.js';
import BattleTacticCard from './BattleTacticCard.js';
import Unit from './Unit.js';

import { bsLayoutSmoother } from './lib/bs/BsSmoother.js';

import fs from 'fs';
import { XMLParser, XMLValidator} from "fast-xml-parser";
import parseCatalog from './lib/parseCatalog.js';

import path from 'path';
import Upgrade from './Upgrade.js';
import { UpgradeType } from './lib/Upgrade.js';
import { BsModifier, ConstraintType, getConstraints } from './lib/bs/BsConstraint.js';
import { UnitType } from './types/UnitType.js';

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
        this.battleTacticCards = [];
        this.keywordLUT = {};
        this.units = {};
        this.lores = new Lores(path);

        this.gameSystem = parseGameSystem(`${path}/Age of Sigmar 4.0.gst`);
        this._parseKeywords();
        this._populateLibraries(path);
        this.battleProfiles = {
            _modName(name) {
                return name.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '');
            },
            put: function (army, profile) {
                const lc = army.toLowerCase();
                let armyset = this[lc];
                if (!armyset) {
                    armyset = {};
                    this[lc] = armyset;
                }
                armyset[this._modName(profile.name)] = profile;
            },
            get: function (army, name) {
                const lc = army.toLowerCase();
                const armyset = this[lc];
                if (!armyset)
                    return null;
                return armyset[this._modName(name)];
            },
            hasProfilesFor(army) {
                const lc = army.toLowerCase();
                const armyset = this[lc];
                return armyset !== null && armyset !== undefined;
            }
        };
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

    // combine army and aos keywords, all uppercase
    _getAvailableKeywords(army) {
        // aos keywords
        let keywords = Object.values(this.keywordLUT);
        // army keywords
        keywords.concat(Object.values(army.keywordLUT));
        keywords = keywords.join(',').toUpperCase().split(',');
        return keywords;
    }

    // check if a keyword is a non (really only seraphon)
    _hasNonPrefix = (options, keyOpt) => {
        // Check if the 4 characters before the needle are 'non-'
        const substr = options.slice(keyOpt.index - 4, keyOpt.index).toUpperCase().trim();
        return substr.startsWith('NON');
    }
    
    getKeywordsFromOption = (option) => {
        option = option.trim();
        // let optionQualifier = option.split(' ')[0];
        const regex = /<([^>]+)>/g;
        const optionKeywords = [];
        for (const match of option.matchAll(regex)) {
            optionKeywords.push({
                keyword: match[1].toUpperCase(),
                index: match.index
            });
        }
        return optionKeywords;
    }

    meetsOption = (unit, option, optionKeywords, availableKeywords) => {
        const testKeyOpt = (allTags, keyOpt) => {
            const isNon = this._hasNonPrefix(option, keyOpt);

            if (allTags.includes(keyOpt.keyword)) {
                return !isNon;
            }
            
            if (!availableKeywords.includes(keyOpt.keyword))
            {
                let name = unit.name.toUpperCase();
                if (keyOpt.keyword === unit.name.toUpperCase()) {
                    return !isNon;
                }
                
                if (name.includes(',')) {
                    const nameNoTitle = name.split(',')[0];
                    if (keyOpt.keyword === nameNoTitle) {
                        return !isNon;
                    }
                }
            }

            return isNon
        }
        
        const getAllTags = (unit) => {
            let allTags = unit._tags;
            if (unit.type !== 0)  // only look at every keyword if it's not a hero
                allTags = allTags.concat(unit.keywords);

            // normalize on uppercase and sort
            return allTags.join(',').toUpperCase().split(',');
        }

        const itrFunc = option.includes(' OR ') ? 'some' : 'every';
        const allTags = getAllTags(unit);

        return optionKeywords[itrFunc]((keyOpt) => {
            return testKeyOpt(allTags, keyOpt);
        });
    }

    validateRegiment(army, regiment) {
        const leader = army.units[regiment[0]];
        if (!leader) {
            console.log(`where are you ${regiment[0]}`)
            return ['critical error'];
        }

        const availableKeywords = this._getAvailableKeywords(army);
        const options = leader.battleProfile.regimentOptions.split(',');
        const aos = this;
        class _Slot {
            constructor(option) {
                const optionUC = option.trim().toUpperCase();
                const qualifier = (() => {
                    const requiredStr = '(REQUIRED)';
                    if (optionUC.includes(requiredStr))
                        return 'REQUIRED';

                    return optionUC.split(' ')[0];
                })();
                const isRequired = qualifier === 'REQUIRED';

                this.originalOption = option;
                this.min = isRequired ? 1 : 0;
                this.max = isRequired ? 1 : 100;
                this.conditional = optionUC.includes(' OR ') ? 'or' : 'and';
                this.keywords = aos.getKeywordsFromOption(option.toUpperCase());
                this.units = [];
                this.priority = isRequired ? 100 : 50; //0-100
                
                if (qualifier.includes('-')) {
                    const minMax = qualifier.split('-');
                    this.min = Number(minMax[0]);
                    this.max = Number(minMax[1]);
                }
            }

            meetsKeywordRequirements(unit) {
                return aos.meetsOption(unit, this.originalOption.toUpperCase(), this.keywords, availableKeywords)
            }

            canAdd(unit) {
                if (this.units.length === this.max) {
                    const error = `You can only select ${this.originalOption}`;
                    console.log(error);
                    return error;
                }

                return null;
            }

            add(unit) {
                this.units.push(unit);
            }

            areRequirementsMet() {
                if (this.min > this.units.length) {
                    return false;
                }
                return true;
            }
        }

        let slots = []
        // initialize the expect slots
        const canLead = options.every(option => {
            const optionUc = option.trim().toUpperCase();
            if (optionUc === 'NONE')
                return false;

            const slot = new _Slot(option);
            slots.push(slot);
            return true;
        });
        if (!canLead) {
            if (leader.battleProfile.notes)
                return [`${leader.name} cannot be a leader: ${leader.battleProfile.notes}`];
            else
                return [`${leader.name} cannot be a leader!`];
        }
        slots = slots.sort((a, b) => b.priorty - a.priority);

        // sort on spaces so we don't hit any keywords that match substrings of other keywords
        // longer keywords also take presidence
        //const sortedKeywords = sortKeywords(keywords);
        const slotUnit = (unit) => {
            const genericError = `Invalid Unit Selection: ${unit.name}`;
            if (unit.type === UnitType.Manifestation ||
                unit.type === UnitType.Terrain ||
                unit.type === UnitType.Unknown
            ) {// it literally shouldn't be possible to hit this error
                return genericError;
            }
            
            let lastError = genericError;
            for (let i = 0; i < slots.length; ++i) {
                if (slots[i].meetsKeywordRequirements(unit)) {
                    const slotError = slots[i].canAdd(unit);
                    lastError = slotError;
                    if (!slotError) {
                        console.log(`${unit.name} met requirement for : ${slots[i].originalOption}`);
                        slots[i].add(unit);
                        return null;
                    }
                }
            }

            return lastError;
        }

        const errors = [];

        regiment.forEach((unitId, idx) => {
            if (idx === 0) // leader
                return;

            const armyUnit = army.units[unitId];
            if (!armyUnit) {
                errors.push(`Unit id could not be found to verify regiment: ${unitId}`);
                return;
            }

            const message = slotUnit(armyUnit);
            if (message)
                errors.push(message);
        });

        slots.forEach(slot => {
            if (!slot.areRequirementsMet())
                errors.push(slot.originalOption);
        });

        return errors;
    }

    // get all the units available to a leader's regiment
    getRegimentOptions(army, leaderId) {
        // to-do literally just make a schema tehre are too many spaces in the plain text
        const leader = army.units[leaderId];
        if (!leader) {
            console.log(`where are you ${leaderId}`)
            return;
        }

        const availableKeywords = this._getAvailableKeywords(army);
        const options = leader.battleProfile.regimentOptions.toUpperCase().split(',');

        const armyUnits = Object.values(army.units);
        const allUnitNames = [];
        armyUnits.forEach(aUnit => {
            allUnitNames.push(aUnit.name.toUpperCase());
        });

        // sort on spaces so we don't hit any keywords that match substrings of other keywords
        // longer keywords also take presidence
        //const sortedKeywords = sortKeywords(keywords);
        const canFieldUnit = (unit) => {
            if (unit.type === UnitType.Manifestation ||
                unit.type === UnitType.Terrain ||
                unit.type === UnitType.Unknown
            ) { // these don't go in a regiment
                return false;
            }

            // const requiredStr = '(REQUIRED)';
            let ok = false;
            options.forEach(option => {
                if (ok) return true;

                option = option.trim();
                const optionKeywords = this.getKeywordsFromOption(option);
                ok |= this.meetsOption(unit, option, optionKeywords, availableKeywords);
            });

            return ok;
        }

        let units = [];
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
                    const unit = new Unit(this, entry);
                    motherloadOfUnits[unit.id] = unit;
                }
            });
        });

        // the forces
        const regiment = '376a-6b97-8699-dd59';
        const aux = '4063-b3a6-e7e1-383f';
        const parsedForces = {};
        this.gameSystem.forceEntries.forEach(forceEntry => {
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
            if (forceEntry.modifiers) {
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
            }

            if (forceEntry.costs) {
                forceEntry.costs.forEach(cost => {
                    if (cost['@name'] === 'pts') {
                        force.points = Number(cost['@value']);
                    }
                });
            }

            if (force.selectableIn.length > 0)
                parsedForces[forceEntry['@id']] = force;

        });
        
        rorData.catalog.entryLinks.forEach(entryLink => {
            const targetId = entryLink['@targetId'];

            if (!entryLink.modifierGroups) {
      //          console.log(`ugh missing modifier groups?! ${entryLink['@name']} ${entryLink['@id']}`)
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
                         //   console.log(`woah buddy your unit is missing from the motherload: ${targetId}`);
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
                               // console.log(`upgrade missing its force? ${upgrade.id} ${upgrade.name}`);
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
        const aos = this;
        profileFiles.forEach(file => {
            const lc = file.toLowerCase();
            if (path.extname(lc) === '.json') {
                const armyName = path.basename(lc).split('.json')[0];
                const json = fs.readFileSync(path.join(profileDir, file));
                const profileList = JSON.parse(json);
                profileList.forEach(profile => {
                    aos.battleProfiles.put(armyName, profile);
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

            if (path.extname(lc) === '.cat') {
                // console.log(lc);
                const fullPath = `${dir}/${file}`;
                const data = parseCatalog(fullPath);
                if (data) {
                    const isCatalog = data['@library'] !== "true";
                    if (isCatalog) {
                        if ((rorData === null) && data['@name'].includes('Regiments of Renown')) {
                            rorData = {
                                catalog: data,
                                librariesLUT: {},
                                libraries: {}
                            };
                        } else {
                            this._database.armyLUT[data['@id']] = data['@name'];
                            this._database.armies[data['@name']] = {
                                catalog: data,
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
            const _attachLibrary = (cat) => { 
                cat.catalogueLinks.forEach(link => {
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
                            if (library.catalogueLinks) {
                                _attachLibrary(library);
                            }
                        }
                    }
                });
            }

            // big waaagh!
            if (data.catalog.sharedSelectionEntries === undefined) {
                // redirect to actual
                const targetId = data.catalog.catalogueLinks[0]['@targetId'];
                const library = libraries[targetId];
                if (library) {
                    data.catalog = library;
                }
            }

            _attachLibrary(data.catalog);
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
                const unit = new Unit(this, entry);
                this.units[unit.id] = unit;
            }
        });

        
        this.gameSystem.sharedSelectionEntries.forEach(entry => {
            if (entry['@type'] === 'unit') {
                const unit = new Unit(this, entry);
             //   console.log(`${unit.name} ${unit.id}`);
                this.units[unit.id] = unit;
            }
        });
    }
}