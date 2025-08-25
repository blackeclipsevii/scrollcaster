
import Lores from './Lores.js';
import Army from './Army.js';
import BattleTacticCard from './BattleTacticCard.js';
import Unit from './Unit.js';

import fs from 'fs';
import parseCatalog, { parseGameSystem } from './lib/parseCatalog.js';

import path from 'path';
import Upgrade from './Upgrade.js';
import BsConstraint, { ConstraintType, getConstraints, BsModifierAttrObj } from './lib/bs/BsConstraint.js';
import { BsCatalog, BsGameSystem, BsLibrary } from './lib/bs/BsCatalog.js';
import BattleProfile from '@scrollcaster/shared-lib/BattleProfile.js';
import { Force, UnitContainerInterf } from '@scrollcaster/shared-lib/Force.js';

import { RegimentValidator } from './lib/validation/RegimentValidation.js';
import { registerAllValidators } from './lib/validation/validators/registerValidators.js';

import { UpgradeType } from '@scrollcaster/shared-lib/UpgradeInterface.js';
import { OtherSuperType, OtherTypes } from '@scrollcaster/shared-lib/OtherTypes.js';
import { safeName } from './lib/helperFunctions.js';

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


interface ArmyAllianceInterf {
    name: string,
    alliance: GrandAlliance
};

export interface AosDatabase {
    path: string;
    armyLUT: {[name: string]: string | undefined};
    armies: {[name: string]: ArmyData | undefined};
}

export class BattleProfileCollection {
    _collection: {
        [name:string]: {[name:string]: Partial<BattleProfile> | null} | null;
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
    getPartial(army: string, name: string): Partial < BattleProfile > | null {
        const lc = army.toLowerCase();
        const armyset = this._collection[lc];
        if (!armyset)
            return null;
        return armyset[this._modName(name)] as BattleProfile;
    }
    get(army: string, name: string): BattleProfile | null {
        return this.getPartial(army, name) as BattleProfile | null;
    }
    hasProfilesFor(army: string) {
        const lc = army.toLowerCase();
        const armyset = this._collection[lc];
        return armyset ? true : false;
    }
}

interface INotableIds {
    allowLegends: string;
    legendsPub: string;
}

export default class AgeOfSigmar {
    _path: string;
    _database: AosDatabase;
    regimentsOfRenown: {[name:string]: Force};
    battleTacticCards: BattleTacticCard[];
    keywordLUT: {[name: string]: string};
    units: {[name: string]: Unit};
    lores: Lores;
    gameSystem: BsGameSystem;
    battleProfiles: BattleProfileCollection;

    // this needs to be handled somewhere else;
    notableIds: INotableIds;

    constructor(path: string) {
        this._path = path;
        this.notableIds = {
            allowLegends: '',
            legendsPub: ''
        };
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
        this.battleProfiles = new BattleProfileCollection;

        const gs = parseGameSystem(`${path}/Age of Sigmar 4.0.gst`);
        if (!gs) {
            throw new Error('Unable to read AOS gst');
        }

        this.gameSystem = gs;
        this._parseGameSystem();
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
    getArmyAlliances() {
        const names = Object.getOwnPropertyNames(this._database.armies);
        const result: ArmyAllianceInterf[] = [];
        names.forEach(name => {
            const lc = name.toLowerCase();
            if (lc.includes('regiments of renown') || lc.includes('[legends]'))
                return;
            
            const army = this._database.armies[name];
            if (army) {
                result.push({
                    name: name,
                    alliance: army.alliance
                });
            }
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

    async loadArmyAsync(armyName: string) {
        try {
            console.log(`Loading ${armyName}...`);
            const army = this.getArmy(armyName);
            if (!army) {
                console.log(`!!WARNING: failed to load ${armyName}`)
            }
        } catch(e: unknown) {
            console.log(`!!ERROR: failed to load ${armyName}: ${e ? e.toString() : 'Unknown error'}`);
        }
    }

    async loadAllArmies() {
        console.time('Populate Libraries');
        await this._populateLibraries(this._path);
        console.timeEnd('Populate Libraries');

        const battleProfilesDir = './resources/battle profiles';
        this._parseBattleProfiles(battleProfilesDir);

        // armies of renown supplimental profiles
        this._parseBattleProfiles(`${battleProfilesDir}/armies of renown`)
        
        registerAllValidators();

        const armyNames = Object.getOwnPropertyNames(this._database.armies)
                                .filter(name => !name.includes('[LEGENDS]'));
        await Promise.all(armyNames.map(armyName => this.loadArmyAsync(armyName)));
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

    findArmy(armyName: string, formationOrAor: string | null): Army | null {
        let army = this.getArmy(armyName);
        if (army)
            return army;

        const safeArmyName = safeName(armyName);
        const safeFormOrAorName = formationOrAor ? safeName(formationOrAor) : null;
        const names = Object.getOwnPropertyNames(this._database.armies);
        let match = null;
        names.every(possibleName => {
            const safePossibility = safeName(possibleName);
            
            if (safeFormOrAorName && safePossibility.includes(safeFormOrAorName)){
                match = possibleName;
                return false;
            }
            
            if (safePossibility.includes(safeArmyName)){
                match = possibleName;
                return false;
            }

            return true;
        });
        
        if (match) {
            return this.getArmy(match);
        }

        return null;
    }

    _loadRegimentsOfRenown(rorData: RorData) {
        const motherloadOfUnits: {[name: string]: Unit} = {};
        const names = Object.getOwnPropertyNames(rorData.libraries);
        names.forEach(name => {
            if (rorData.catalog.sharedSelectionEntries) {
                rorData.catalog.sharedSelectionEntries.forEach(entry => {
                    // gotrek is in here
                    if (entry['@type'] === 'unit') {
                        const unit = new Unit(this, entry);
                        motherloadOfUnits[unit.id] = unit;
                    }
                });
            }

            const library = rorData.libraries[name];
            if (library.sharedSelectionEntries) {
                library.sharedSelectionEntries.forEach(entry => {
                    if (entry['@type'] === 'unit') {
                        const unit = new Unit(this, entry);
                        motherloadOfUnits[unit.id] = unit;
                    }
                });
            }
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
                type: OtherTypes.RegimentOfRenown,
                superType: OtherSuperType,
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
                                            const armyName = this._database.armyLUT[condition['@childId']];
                                            if (armyName && !armyName.includes('[LEGENDS]'))
                                                force.selectableIn.push(armyName);
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
        
        if (!rorData.catalog.entryLinks) {
            throw new Error('Data organization has changed, entry links missing for Regiments of Renown catalog');
        }

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

                        const obj: UnitContainerInterf = {
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
        if (rorData.catalog.sharedSelectionEntries) {
            rorData.catalog.sharedSelectionEntries.forEach(entry => {
                if (entry['@type'] === 'upgrade') {
                    const upgrade = new Upgrade(entry, UpgradeType.RegimentOfRenown, null);
                    if (entry.modifiers) {
                        entry.modifiers.forEach(mod => {
                            if (mod.conditions) {
                                mod.conditions.forEach(condition => {
                                    if (condition['@field'] === 'selections' &&
                                        condition['@scope'] === 'force') {
                                        const childId = condition['@childId'];
                                        const force = parsedForces[childId];
                                        if (!force) {
                                            console.log(`upgrade missing its force? ${upgrade.id} ${upgrade.name}`);
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
        }

        // aos can see them all TO-DO maybe overkill
        this.regimentsOfRenown = parsedForces;
    }

    _parseBattleProfiles(profileDir: string) {
        // relative to server.js
        const profileFiles = fs.readdirSync(profileDir);
        // const armyCatNames = Object.getOwnPropertyNames(this._database.armies);
        // populate the armies and seperate the libraries
        profileFiles.forEach(file => {
            const lc = file.toLowerCase();
            if (path.extname(lc) === '.json') {
                const armyName = path.basename(lc).split('.json')[0];
                const json = fs.readFileSync(path.join(profileDir, file)).toString();
                const profileList = JSON.parse(json) as BattleProfile[];
                profileList.forEach(profile => {
                    this.battleProfiles.put(armyName, profile);
                });
            }
        });
    }

    async _populateLibraries(dir: string) {
        const libraries: {[name:string]: BsLibrary | null} = {}
        let rorData: RorData | null = null;
        
        const allFiles = fs.readdirSync(dir);
        const catFiles = allFiles.filter(file => (path.extname(file.toLowerCase()) === '.cat') && !file.includes('[LEGENDS]'));
        const asyncParseCat = async (name: string) => parseCatalog(name);
        const datasets = await Promise.all(catFiles.map(cat => asyncParseCat(`${dir}/${cat}`))) as (BsCatalog | null)[];

        datasets.forEach(data => {
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
                    libraries[data['@id']] = data as BsLibrary;
                }
            }
        });

        const attachLibraries = async (data: RorData | ArmyData) => {
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
                                if (data instanceof ArmyData && data.alliance === GrandAlliance.UNKNOWN &&
                                    library.sharedSelectionEntries // nothing to check
                                ) {
                                    // determine the alliance
                                    library.sharedSelectionEntries.every(entry => {
                                        let cont = true;
                                        if(entry['@type'] === 'unit') {
                                            entry.categoryLinks?.every(link => {
                                                if (link['@name'] as GrandAlliance === GrandAlliance.CHAOS ||
                                                    link['@name'] as GrandAlliance === GrandAlliance.DEATH ||
                                                    link['@name'] as GrandAlliance === GrandAlliance.ORDER ||
                                                    link['@name'] as GrandAlliance === GrandAlliance.DESTRUCTION) {
                                                    data.alliance = link['@name'] as GrandAlliance;
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
                    console.log (`reassignment of library ${data.catalog['@name']}`)
                    data.catalog = library as BsCatalog;
                }
            }

            _attachLibrary(data.catalog);
        }

        // now attach the libraries to their armies
        const armies = Object.values(this._database.armies);
        await Promise.all(armies.map(army => attachLibraries(army as ArmyData)));

        if (rorData) {
            await attachLibraries(rorData);
            this._loadRegimentsOfRenown(rorData);
        }
    }

    _parseGameSystem() {
        if (!this.gameSystem)
            return;

        // get a lut for keywords
        this.gameSystem.categoryEntries.forEach(entry => {
            const potentialKeyword = entry['@name'];
            // all keywords are uppercase
            if (/^[A-Z0-9]+$/.test(potentialKeyword))
                this.keywordLUT[entry['@id']] = potentialKeyword;
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
            
            if (entry['@name'] === 'Allow Legends') {
                this.notableIds.allowLegends = entry['@id'];
            }
        });

        this.gameSystem.publications.forEach(pub => {
            if (pub['@name'] === 'Warhammer Legends') {
                this.notableIds.legendsPub = pub['@id'];
            }
        });

        this.gameSystem.sharedSelectionEntries.forEach(entry => {
            if (entry['@type'] === 'unit') {
                const unit = new Unit(this, entry);
             // console.log(`${unit.name} ${unit.id}`);
                this.units[unit.id] = unit;
            }
        });
    }
}