import fs from 'fs'
import Unit from './Unit.js';
import { XMLParser, XMLValidator} from "fast-xml-parser"
import { bsLayoutSmoother } from './BsSmoother.js';

export default class Army {
    constructor(dir, armyFilename) {
        this.catalogues = {};
        this.upgrades = {};
        this.points = {};
        this.units = {};
        this._parse(dir, armyFilename);
    }

    _parseCatalogue(path) {
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
        return root.catalogue;
    }

    _readCatalogue(dir, name) {
        const path = `${dir}/${name}.cat`;
        const catalogue = this._parseCatalogue(path);
        if (!catalogue)
            return;

        this.catalogues[name] = catalogue;
        const entries = catalogue.sharedSelectionEntries;
        catalogue.sharedSelectionEntries.forEach(entry => {
            const unit = new Unit(entry);
            this.units[unit.id] = unit;
        });
    }

    _parse(dir, filename) {
        let catalogue = this._parseCatalogue(`${dir}/${filename}`);
        if (!catalogue)
            return;

        // generate upgrades from root cat
        this.catalogue = catalogue;
        this.id = catalogue['@id'];

        // get the units
        catalogue.catalogueLinks.forEach(link => {
            // skip narrative
            const lc = link['@name'].toLowerCase();
            if (lc.includes('path to glory'))
                return;

            if (lc.includes(' - library')) {
                this._readCatalogue(dir, link['@name']);
            }
        });

        // update the capabilities of each unit
        catalogue.entryLinks.forEach(link => {
            let unit = this.units[link['@targetId']];
            if (!unit) {
                console.log (`unable to find unitid: ${link['@targetId']}`);
                console.log(`link :${JSON.stringify(link)}`);
                return;
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
        });

        
        // sort the units by type
        // this.units.sort((a, b) => a.type - b.type);
    }
}