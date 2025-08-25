
import Unit, { isUndersizedUnit } from './Unit.js';
import Upgrade from './Upgrade.js'
import AgeOfSigmar from './AgeOfSigmar.js';
import { BsSelectionEntry, BsSelectionEntryGroup } from './lib/bs/BsCatalog.js';
import { Force } from '../shared-lib/Force.js';
import { UnitType } from '../shared-lib/UnitInterface.js';
import { ArmyValidator, armyValidatorCollection } from './lib/validation/ArmyValidator.js';
import BattleProfile from '../shared-lib/BattleProfile.js';
import { toCamelCase } from './lib/helperFunctions.js';

import { UpgradeType, UpgradeLUT } from '../shared-lib/UpgradeInterface.js';
import { ArmyUpgrades } from '../shared-lib/ArmyUpgrades.js';
import ArmyInterf from '../shared-lib/ArmyInterface.js';
import LoreInterf from '../shared-lib/LoreInterface.js';

interface UpgradeLUTEntry {
    alias: string;
    type: number;
}

const upgradeLUT: {[name:string]: UpgradeLUTEntry} = {
    'battle formation': {
        alias: 'battleFormations',
        type: UpgradeType.BattleFormation
    },
    'battle traits': {
        alias: 'battleTraits',
        type: UpgradeType.BattleTrait
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
    },
    'enhancements': {
        alias: 'enhancements',
        type: UpgradeType.Enhancement
    }
};

export default class Army implements ArmyInterf{
    id: string;
    name: string;
    points: {[name:string]: number};
    units: {[name:string]: Unit};
    upgrades: ArmyUpgrades;
    keywordLUT: {[name:string]: string};
    regimentsOfRenown: Force[];
    _tags: {[name:string]: string};
    isArmyOfRenown: boolean;
    validator: ArmyValidator | null;
    lut: {[id: string]: unknown};

    constructor(ageOfSigmar: AgeOfSigmar, armyName: string) {
        // the name of the army
        this.id = '';
        this.name = armyName;

        this.validator = null;
        
        let shortName = armyName;
        if (shortName.includes(' - '))
            shortName = shortName.split(' - ')[1];

        this.validator = armyValidatorCollection.get(shortName);

        // upgrades available to the army
        this.upgrades = {
            battleFormations: {},
            battleTraits: {},
            lores: {
                manifestation: {},
                spell: {},
                prayer: {}
            },
            enhancements: {}
        };

        // LUT for point values
        this.points = {};

        // Units available to the army
        this.units = {};

        // LUT for keywords
        this.keywordLUT = {};

        // Regiments of Renown available to the army
        this.regimentsOfRenown = [];

        // Tags - keywords that aren't really keywords
        this._tags = {};

        // lookup anything
        this.lut = {};

        this.isArmyOfRenown = armyName.includes(' - ') && !armyName.includes('Library');
        this._parse(ageOfSigmar, armyName);
    }

    _parse(ageOfSigmar: AgeOfSigmar, armyName: string) {
        const data = ageOfSigmar._database.armies[armyName];
        if (!data) {
            console.log (`ERROR: data not found for ${armyName}`);
            return;
        }

        const catalogue = data.catalog;
        if (!catalogue) {
            console.log (`ERROR: catalogue not found for ${armyName}`);
            return;
        }

      //  console.log(catalogue['@id']);
        this.id = catalogue['@id'];

        const _libraryUnits: {[name: string]: Unit} = {};

        // read all the units out of the libraries
        const names = Object.getOwnPropertyNames(data.libraries);
        names.forEach(name => {
            const library = data.libraries[name];
            if (library.sharedSelectionEntries) {
                library.sharedSelectionEntries.forEach(entry => {                
                    if (entry['@type'] === 'unit' &&
                        entry['@publicationId'] !== ageOfSigmar.notableIds.legendsPub
                    ) {
                        const unit = new Unit(ageOfSigmar, entry);
                        _libraryUnits[unit.id] = unit;
                        this.lut[unit.id] = unit;
                    }
                });
            }
        })
        
        if (catalogue.categoryEntries) {
            catalogue.categoryEntries.forEach(category => {
                const potentialKeyword = category['@name'];
                // all keywords are uppercase
                if (/^[^a-z]+$/.test(potentialKeyword))
                    this.keywordLUT[category['@id']] = potentialKeyword;
                else
                    this._tags[category['@id']] = potentialKeyword;
                this.lut[category['@id']] = category['@name'];
            });
        }

        const ulKeys = Object.getOwnPropertyNames(upgradeLUT);

        const addUpgrade = (upgrades: ArmyUpgrades, key: string, element: BsSelectionEntry, parent: BsSelectionEntryGroup | null) => {
            const lu = upgradeLUT[key];
            const isLore = (lu.type as UpgradeType === UpgradeType.ManifestationLore ||
                            lu.type as UpgradeType === UpgradeType.SpellLore ||
                            lu.type as UpgradeType === UpgradeType.PrayerLore);

            if (isLore) {
                // add lore upgrade
                // lores are in their own catalog so they're pre populated
                if (!element.entryLinks) 
                    return false;

                const targetId = element.entryLinks[0]['@targetId'];
                if (!targetId)
                    return false;
                
                let lore = ageOfSigmar.lores.lores[lu.alias][targetId];
                if (!lore)
                    return false;

                if (element.costs) {
                    element.costs.forEach(cost => {
                        if (cost['@typeId'] === 'points') {
                            lore = JSON.parse(JSON.stringify(lore)) as LoreInterf;
                            lore.points = Number(cost['@value']);
                        }
                    });
                }
                
                lore.unitIds.forEach(unitId => {
                    const unit = _libraryUnits[unitId];
                    if (!unit) {
                        console.log(`WARNING: Unable to find unit link in library: ${unitId}`);
                        return false;
                    }
                    this.units[unitId] = unit;
                });
                
                upgrades.lores[lu.alias][lore.name] = lore;
                return true;
            }

            
            if (parent && key === upgradeLUT.enhancements.alias) {
                const ccName = toCamelCase(parent['@name']);
                if (!upgrades.enhancements[ccName]) {
                    upgrades.enhancements[ccName] = {
                        name: parent['@name'],
                        id: parent['@id'],
                        upgrades: {}
                    };
                }
                const upgrade = new Upgrade(element, lu.type, parent['@name']);
                this.lut[upgrade.id] = upgrade;
                upgrades.enhancements[ccName].upgrades[upgrade.name] = upgrade;
            } else {
                const upgrade = new Upgrade(element, lu.type, null);
                this.lut[upgrade.id] = upgrade;
                (upgrades[lu.alias] as UpgradeLUT)[upgrade.name] = upgrade;
            }
        }
        
        if (catalogue.sharedSelectionEntries) {
            catalogue.sharedSelectionEntries.forEach(entry => {
                const lc = entry['@name'].toLowerCase();
                if (entry['@type'] === 'unit') {
                    const unit = new Unit(ageOfSigmar, entry);
                    _libraryUnits[unit.id] = unit;
                    this.lut[unit.id] = unit;
                } else {
                    ulKeys.forEach(key => {
                        if (lc.includes(key)) {
                            // console.log(entry, null, 2);
                            addUpgrade(this.upgrades, key, entry, null);
                        }
                    });
                }
            });
        }

        catalogue.sharedSelectionEntryGroups.forEach(sharedGroup => {
            const lc = sharedGroup['@name'].toLowerCase();
            
            // writing it this way adds a compile check that enhancements is valid
            let key = upgradeLUT.enhancements.alias;
            ulKeys.every(k => {
                if (lc.includes(k)) {
                    key = k;
                    return false;
                }
                return true;
            });

            if (key === upgradeLUT.enhancements.alias) {
                // filter out ptg
                if (lc.includes('drained') || lc.includes('battle wounds')) {
                    return;
                }
            }

            if (sharedGroup.selectionEntryGroups) {
                sharedGroup.selectionEntryGroups.forEach(group => {
                    if (group.selectionEntries) {
                        group.selectionEntries.forEach(element => {
                            addUpgrade(this.upgrades, key, element, sharedGroup);
                        });
                    }
                });
            } else if (sharedGroup.selectionEntries) {
                sharedGroup.selectionEntries.forEach(element => {
                    addUpgrade(this.upgrades, key, element, null);
                });
            }

            ageOfSigmar.lores.universal.forEach(itr => {
                const universalLore = ageOfSigmar.lores.lores.manifestation[itr.id];
                universalLore.points = itr.points;
                universalLore.type = itr.type;
                this.upgrades.lores.manifestation[`UNIVERSAL-${universalLore.name}`] = universalLore;
            });
        });

        if (!catalogue.entryLinks) {
            throw new Error(`Data organization has changed, entry links missing for catalog: ${catalogue['@name']}`);
        }

        // update the capabilities of each unit
        catalogue.entryLinks.forEach(link => {
            // this is the global library for the faction
            const unit = _libraryUnits[link['@targetId']];
            if (!unit || isUndersizedUnit(link)) {
                return;
            }

            if (ageOfSigmar.battleProfiles) {
                const armySplit = armyName.split(' - ');
                const baseArmyName = armySplit[0];
                const supplimentalArmyName = armySplit.length > 1 ? armySplit[1] : null;
                if (!ageOfSigmar.battleProfiles.hasProfilesFor(baseArmyName)) {
                    throw new Error(`Missing battle profiles for ${baseArmyName}`);
                }
            
                unit.battleProfile = ageOfSigmar.battleProfiles.get(baseArmyName, unit.name);
                if (!unit.battleProfile && armySplit.length > 1 && armySplit[1].toLowerCase().includes('big waaagh')) {
                    const otherArmy = baseArmyName === 'Kruleboyz' ? 'Ironjawz' : 'Kruleboyz';
                    unit.battleProfile = ageOfSigmar.battleProfiles.get(otherArmy, unit.name);
                }

                if (!unit.battleProfile) {
                    if (unit.type as UnitType === UnitType.Hero) {
                        if (!(unit.legends || unit.name.includes('Apotheosis'))) {
                            console.log(`!!WARNING: profile not found for ${unit.name}`);
                        }
                    }
                }

                if (supplimentalArmyName) {
                    const aorProfile = ageOfSigmar.battleProfiles.getPartial(supplimentalArmyName, unit.name);
                    if (aorProfile) {
                        // make a copy before we edit it
                        unit.battleProfile = JSON.parse(JSON.stringify(unit.battleProfile)) as BattleProfile;
                        if (aorProfile.replace) {
                            unit.battleProfile.notes = aorProfile.notes ? aorProfile.notes : null;
                            unit.battleProfile.regimentOptions = aorProfile.regimentOptions ? aorProfile.regimentOptions : '';
                        } else {
                            const addPart = (unitStr: string | null, aorStr: string | null | undefined, joinStr: string) => {
                                if (aorStr)
                                    return (unitStr && unitStr.length > 0) ? `${unitStr}${joinStr}${aorStr}` : aorStr;
                                return unitStr;
                            }
                            unit.battleProfile.notes = addPart(unit.battleProfile.notes, aorProfile.notes, '. ');
                            unit.battleProfile.regimentOptions = addPart(unit.battleProfile.regimentOptions, aorProfile.regimentOptions, ', ') || '';
                            console.log(`update profile for ${unit.name}`);
                        }
                    }
                }
            }

            if (link.entryLinks) {
                link.entryLinks.forEach(ele => {
                    const lc = ele['@name'].toLowerCase();

                    // skip these we don't support them right now
                    if (lc.includes('battle wounds') ||
                        lc.includes('renown') ||
                        lc.includes('paths')) {
                            return;
                        }

                    if (lc.includes('warlord')) {
                        unit.canBeGeneral = true;
                        return;
                    }
                    else if (lc.includes('reinforced')) {
                        unit.canBeReinforced = true;
                        return;
                    }
                    else {
                        // add enhancement slot
                        unit.enhancements[toCamelCase(ele['@name'])] = {
                            name: ele['@name'],
                            id: ele['@targetId'],
                            slot: null
                        };
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
                                const tag = this._tags[modifier['@value']];
                                if (tag) {
                                    unit._tags.push(tag);
                                }
                            }
                        });
                    }
                });
            }

            
            // these are the units this army can use
            this.units[unit.id] = unit;
        });

        // get this armies regiments
        // to-do maybe this can be an endpoint that we only present if asked
        const rorIds = Object.getOwnPropertyNames(ageOfSigmar.regimentsOfRenown);
        rorIds.forEach(rorId => {
            if (!ageOfSigmar.regimentsOfRenown)
                return false;
            const ror = (ageOfSigmar.regimentsOfRenown as {[name:string]: Force})[rorId];
            ror.selectableIn.forEach(name => {
                if (armyName === name) {
                    this.regimentsOfRenown.push(ror);
                    this.lut[ror.id] = ror;
                }
            });
        });

        // sort the units by type
        // this.units.sort((a, b) => a.type - b.type);
    }
}