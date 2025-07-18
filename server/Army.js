
import Unit from './Unit.js';
import Upgrade from './Upgrade.js'
import { UpgradeType } from "../shared/UpgradeType.js";

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
        this._libraryUnits = {};
        this.unitLUT = {};
        this.keywordLUT = {};
        // TO-DO what about big waaagh!s
        this.isArmyOfRenown = armyName.includes(' - ') && !armyName.includes('Library');
        this._parse(ageOfSigmar, armyName);
    }

    _availableUnits(ageOfSigmar, entryLink) {
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
            units: [],
            keywords: [],
            _tags: []
        };

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
                        if (modifier['@type'] === 'add' &&
                            modifier['@scope'] === 'force') {
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

        // read all the units out of the libraries
        const names = Object.getOwnPropertyNames(data.libraries);
        names.forEach(name => {
            data.libraries[name].sharedSelectionEntries.forEach(entry => {
                if (entry['@type'] === 'unit') {
                    const unit = new Unit(entry);
                    this._libraryUnits[unit.id] = unit;
                }
            });
        })

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
                            const unit = this._libraryUnits[uuid];
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
                this._libraryUnits[unit.id] = unit;
            } else {
                ulKeys.forEach(key => {
                    if (lc.includes(key)) {
                        // console.log(entry, null, 2);
                        addUpgrade(this.upgrades, key, entry);
                    }
                });
            }
        })

        if (catalogue.catalogEntries) {
            catalogue.categoryEntries.forEach(category => {
                this.keywordLUT[category['@id']] = category['@name'];
            });
        }

        // update the capabilities of each unit
        catalogue.entryLinks.forEach(link => {
            // this is the global library for the faction
            let unit = this._libraryUnits[link['@targetId']];
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
            this._availableUnits(ageOfSigmar, link);
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
        

        // sort the units by type
        // this.units.sort((a, b) => a.type - b.type);
    }
}