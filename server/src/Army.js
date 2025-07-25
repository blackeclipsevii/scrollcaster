
import Unit from './Unit.js';
import Upgrade from './Upgrade.js'
import { UpgradeType } from "./types/UpgradeType.js";
import { Lore } from './Lores.js';

// id designation the legends publication
const LegendsPub = "9dee-a6b2-4b42-bfee";

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
        // the name of the army
        this.name = armyName;

        // upgrades available to the army
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

        // LUT for point values
        this.points = {};

        // Units available to the army
        this.units = {};

        // LUT for units
        this.unitLUT = {};

        // LUT for keywords
        this.keywordLUT = {};

        // Regiments of Renown available to the army
        this.regimentsOfRenown = [];

        // Tags - keywords that aren't really keywords
        this._tags = {};

        this.isArmyOfRenown = armyName.includes(' - ') && !armyName.includes('Library');
        this._parse(ageOfSigmar, armyName);
    }

    _parse(ageOfSigmar, armyName) {
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

        this.id = catalogue['@id'];

        const _libraryUnits = {};

        // read all the units out of the libraries
        const names = Object.getOwnPropertyNames(data.libraries);
        names.forEach(name => {
            data.libraries[name].sharedSelectionEntries.forEach(entry => {
                if (entry['@type'] === 'unit' &&
                    entry['@publicationId'] !== LegendsPub
                ) {
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
                if (element.entryLinks) {
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
                else
                {   // if it's not in the lore don't add it
                    return false;
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

            if (ageOfSigmar.battleProfiles) {
                unit.battleProfile = ageOfSigmar.battleProfiles.get(unit.name);
                if (!unit.battleProfile) {
                    console.log(`profile not found for ${unit.name}`);
                }
            }

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
                                  //  console.log(`${unit.name} tag added : ${keyword}`);
                                    unit._tags.push(keyword);
                                }
                            }
                        });
                    }
                });
            }

            
            // these are the units this army can use
            this.units[unit.id] = unit;
            this.unitLUT[link['@id']] = unit.id;
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
                    } else if (entry.selectionEntries) {
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