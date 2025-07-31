
import Lores from './Lores.js';
import Army from './Army.js';
import BattleTacticCard from './BattleTacticCard.js';
import Unit from './Unit.js';

import fs from 'fs';
import parseCatalog, { parseGameSystem } from './lib/parseCatalog.js';

import path from 'path';
import Upgrade from './Upgrade.js';
import { UpgradeType } from './lib/Upgrade.js';
import BsConstraint, { ConstraintType, getConstraints, BsModifierAttrObj } from './lib/bs/BsConstraint.js';
import { BsCatalog, BsGameSystem, BsLibrary } from './lib/bs/BsCatalog.js';
import BattleProfile from './BattleProfile.js';
import { Force } from './Force.js';

import { RegimentValidator } from './RegimentValidation.js';

// intermediate step
interface MyConstraints {
    LUT: string[];
    constraints: {[name:string]: BsConstraint};
}

export enum GrandAlliance {
    ORDER = "ORDER",
    CHAOS = "CHAOS",
    DEATH = "DEATH",
    DESTRUCTION = "DESTRUCTION",
    UNKNOWN = "UNKNOWN"
}

class RorData {
    catalog: BsCatalog;
    librariesLUT: {[name:string]:string};
    libraries: {[name:string]: BsLibrary};
    constructor(catalog: BsCatalog) {
        this.catalog = catalog;
        this.librariesLUT = {};
        this.libraries = {};
    }
}

class ArmyData extends RorData {
    alliance: GrandAlliance;
    army: Army | null

    constructor(catalog: BsCatalog) {
        super(catalog);
        this.alliance = GrandAlliance.UNKNOWN;
        this.army = null
    }
}

export interface AosDatabase {
    path: string;
    armyLUT: {[name: string]: string};
    armies: {[name: string]: ArmyData};
}

export class BattleProfileCollection {
    _collection: {
        [name:string]: {[name:string]:BattleProfile}
    };
    constructor() {
        this._collection = {};
    }
    _modName(name: string) {
        return name.toLowerCase().replace(/[^a-zA-Z0-9 ]/g, '');
    }
    put(army: string, profile: BattleProfile) {
        const lc = army.toLowerCase();
        let armyset = this._collection[lc];
        if (!armyset) {
            armyset = {};
            this._collection[lc] = armyset;
        }
        armyset[this._modName(profile.name)] = profile;
    }
    get(army: string, name: string) {
        const lc = army.toLowerCase();
        const armyset = this._collection[lc];
        if (!armyset)
            return null;
        return armyset[this._modName(name)];
    }
    hasProfilesFor(army: string) {
        const lc = army.toLowerCase();
        const armyset = this._collection[lc];
        return armyset !== null && armyset !== undefined;
    }
}

export default class AgeOfSigmar {
    _database: AosDatabase;
    regimentsOfRenown: {[name:string]: Force};
    battleTacticCards: BattleTacticCard[];
    keywordLUT: {[name: string]: string};
    units: {[name: string]: Unit};
    lores: Lores;
    gameSystem: BsGameSystem;
    battleProfiles: BattleProfileCollection;

    constructor(path: string) {
        this._database = {
            path: path,
            armyLUT: {},
            armies: {}
        }
        this.regimentsOfRenown = {};
        this.battleTacticCards = [];
        this.keywordLUT = {};
        this.units = {};
        this.lores = new Lores(path);

        const gs = parseGameSystem(`${path}/Age of Sigmar 4.0.gst`);
        if (!gs) {
            throw 'Unable to read AOS gst';
        }

        this.gameSystem = gs;
        this._parseKeywords();
        this._populateLibraries(path);
        this.battleProfiles = new BattleProfileCollection;
        this._parseBattleProfiles();
    }

    // combine army and aos keywords, all uppercase
    _getAvailableKeywords(army: Army) {
        // aos keywords
        let keywords = Object.values(this.keywordLUT);
        // army keywords
        keywords.concat(Object.values(army.keywordLUT));
        keywords = keywords.join(',').toUpperCase().split(',');
        return keywords;
    }

    getRegimentOptions(army: Army, leaderId: string) {
        const allKeywords = this._getAvailableKeywords(army);
        return RegimentValidator.getRegimentOptions(army, leaderId, allKeywords);
    }

    validateRegiment(army: Army, regiment: string[]) {
        const allKeywords = this._getAvailableKeywords(army);
        return RegimentValidator.validateRegiment(army, regiment, allKeywords);
    }

    getArmyAlliances() {
        interface ArmyAllianceInterf {
            name: string,
            alliance: GrandAlliance
        };
        const names = Object.getOwnPropertyNames(this._database.armies);
        const result: ArmyAllianceInterf[] = [];
        names.forEach(name => {
            const lc = name.toLowerCase();
            if (lc.includes('regiments of renown') || lc.includes('[legends]'))
                return;
            result.push({
                name: name,
                alliance: this._database.armies[name].alliance
            });
        });
        const allianceNumber = (alliance: GrandAlliance) => {
            if (alliance === GrandAlliance.ORDER)
                return 0;
            if (alliance === GrandAlliance.CHAOS)
                return 1;
            if (alliance === GrandAlliance.DEATH)
                return 2;
            return 3;
        }
        result.sort((a, b) => {
            const result = allianceNumber(a.alliance) - allianceNumber(b.alliance);
            if (result === 0)
                return a.name.localeCompare(b.name);
            return result;
        });
        return result
    }

    getArmy(armyName: string) {
        const data = this._database.armies[armyName];
        // if it isn't parsed, it doesn't exist
        if (!data)
            return null;

        if (data.army)
            return data.army;

        data.army = new Army(this, armyName);
        return data.army;
    }

    _loadRegimentsOfRenown(rorData: RorData) {
        const motherloadOfUnits: {[name: string]: Unit} = {};
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
        const parsedForces: {[name:string]: Force} = {};
        this.gameSystem.forceEntries.forEach(forceEntry => {
            // skip these
            if (forceEntry['@id'] === regiment || forceEntry['@id'] === aux) {
                return;
            }

            // we want special stuff
            const force: Force = {
                selectableIn: [],
                id: forceEntry['@id'],
                name: forceEntry['@name'],
                unitContainers: [],
                upgrades: [],
                points: 0
            };
            
            // where do i put it
            if (forceEntry.modifiers) {
                forceEntry.modifiers.forEach(modifier => {
                    if (modifier['@type'] === "set") {
                        modifier.conditionGroups.forEach(cgParent => {
                            // this should be a group pairing AOS with the other parents
                            if (cgParent.conditionGroups) {
                                cgParent.conditionGroups.forEach(cgArmies => {
                                    cgArmies.conditions.forEach(condition => {
                                        if (condition['@type'] === 'instanceOf' &&
                                            condition['@field'] === 'selections' &&
                                            condition['@scope'] === 'parent') {
                                            force.selectableIn.push(condition['@childId']);
                                        }
                                        
                                    });
                                });
                            }
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

            const myConstraints = getConstraints(entryLink) as MyConstraints;

            // this is probably wildly overkill as most (all?) ror are fixed in size
            entryLink.modifierGroups.forEach(modGroup => {
                
                modGroup.modifiers.forEach(mod => {
                    const cObj = myConstraints.constraints[mod['@field']];
                    if (cObj) {
                        const mObj = new BsModifierAttrObj(mod);
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
                            //console.log(`force not found when loading ror units: ${forceId}`);
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
                if (entry.modifiers) {
                    entry.modifiers.forEach(mod => {
                        if (mod.conditions) {
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
                        }
                    });
                }
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
                const json = fs.readFileSync(path.join(profileDir, file)).toString();
                const profileList = JSON.parse(json) as BattleProfile[];
                profileList.forEach(profile => {
                    aos.battleProfiles.put(armyName, profile);
                });
            }
        });
    }

    _populateLibraries(dir: string) {
        const catFiles = fs.readdirSync(dir);
        const libraries: {[name:string]: BsLibrary} = {}
        let rorData: RorData | null = null;
        // populate the armies and seperate the libraries
        catFiles.forEach(file => {
            const lc = file.toLowerCase();

            if (path.extname(lc) === '.cat') {
                // console.log(lc);
                const fullPath = `${dir}/${file}`;
                const data = parseCatalog(fullPath) as BsCatalog | null;
                if (data) {
                    const isCatalog = data['@library'] !== "true";
                    if (isCatalog) {
                        if ((rorData === null) && data['@name'].includes('Regiments of Renown')) {
                            rorData = new RorData(data);
                        } else {
                            this._database.armyLUT[data['@id']] = data['@name'];
                            this._database.armies[data['@name']] = new ArmyData(data);
                        }
                    } 
                    else  {
                        libraries[data['@id']] = data;
                    }
                }
            }
        });

        const attachLibraries = (data: RorData | ArmyData) => {
            const _attachLibrary = (cat: BsCatalog | BsLibrary) => { 
                if (cat.catalogueLinks) {
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
                                if (data instanceof ArmyData && data.alliance === GrandAlliance.UNKNOWN) {
                                    // determine the alliance
                                    library.sharedSelectionEntries.every(entry => {
                                        let cont = true;
                                        if(entry['@type'] === 'unit') {
                                            entry.categoryLinks?.every(link => {
                                                if (link['@name'] === GrandAlliance.CHAOS ||
                                                    link['@name'] === GrandAlliance.DEATH ||
                                                    link['@name'] === GrandAlliance.ORDER ||
                                                    link['@name'] === GrandAlliance.DESTRUCTION) {
                                                    data.alliance = link['@name'];
                                                    cont = false;
                                                }
                                                return cont;
                                            });
                                        }
                                        return cont;
                                    });
                                }
                                if (library.catalogueLinks) {
                                    _attachLibrary(library);
                                }
                            }
                        }
                    });
                }
            }

            // big waaagh!
            if (data.catalog.sharedSelectionEntries === undefined) {
                // redirect to actual
                const targetId = data.catalog.catalogueLinks[0]['@targetId'];
                const library = libraries[targetId];
                if (library) {
                    data.catalog = library as BsCatalog;
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

        if (rorData !== null) {
            attachLibraries(rorData);
            this._loadRegimentsOfRenown(rorData);
        }
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
                if (entry.selectionEntryGroups) {
                    entry.selectionEntryGroups.forEach(group => {
                        if (group.selectionEntries) {
                            group.selectionEntries.forEach(tacticEntry => {
                                const btCard = new BattleTacticCard(tacticEntry);
                                this.battleTacticCards.push(btCard);
                            });
                        }
                    });
                }
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