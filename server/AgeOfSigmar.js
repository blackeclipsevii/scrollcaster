
import Lores from './Lores.js';
import Army from './Army.js';
import BattleTacticCard from './BattleTacticCard.js';
import Unit from './Unit.js';

import { bsLayoutSmoother } from './lib/BsSmoother.js';

import fs from 'fs';
import { XMLParser, XMLValidator} from "fast-xml-parser";
import parseCatalog from './lib/parseCatalog.js';

import path from 'path';

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
        this.lores = new Lores(path);
        this._populateLibraries(path);

        this.gameSystem = parseGameSystem(`${path}/Age of Sigmar 4.0.gst`);
        this.keywordLUT = {};
        this.battleTacticCards = [];
        this.units = {};
        this._parseKeywords();
    }

    getArmyNames() {
        return Object.getOwnPropertyNames(this._database.armies);
    }

    getArmy(armyName) {
        const data = this._database.armies[armyName];
        if (data.army)
            return data.army;

        data.army = new Army(this, armyName);
        return data.army;
    }

    _populateLibraries(dir) {
        const catFiles = fs.readdirSync(dir);
        const libraries = {}

        // populate the armies and seperate the libraries
        catFiles.forEach(file => {
            const lc = file.toLowerCase();
            console.log(lc);

            if (path.extname(lc) === '.cat' &&
                !lc.includes('legends]') &&
                !lc.includes('regiments of ')) {
                const fullPath = `${dir}/${file}`;
                const data = parseCatalog(fullPath);
                if (data) {
                    const isCatalog = data['@library'] !== "true";
                    if (isCatalog) {
                        this._database.armyLUT[data['@id']] = data['@name'];
                        this._database.armies[data['@name']] = {
                            catalog: data,
                            librariesLUT: {},
                            libraries: {},
                            army: null
                        }
                    } else {
                        libraries[data['@id']] = data;
                    }
                }
            }
        });

        // now attach the libraries to their armies
        const armyIds = Object.getOwnPropertyNames(this._database.armies);
        armyIds.forEach(armyName => {
            const data = this._database.armies[armyName];
            data.catalog.catalogueLinks.forEach(link => {
                const name = link['@name'].toLowerCase();
                // lores we handle seperately
                // don't tackle narrative right now
                if (!name.includes(' lores') && !name.includes('path to glory')) {
                    const targetId = link['@targetId'];
                    const library = libraries[targetId];
                    if (library) {
                        data.libraries[link['@name']] = library;
                        data.librariesLUT[targetId] = link['@name'];
                    }
                }
            });
        });
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