import fs from 'fs'
import { XMLParser, XMLValidator} from "fast-xml-parser"
import { bsLayoutSmoother } from './BsSmoother.js';

import BattleTacticCard from './BattleTacticCard.js';

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
        this.gameSystem = parseGameSystem(`${path}/Age of Sigmar 4.0.gst`);
        this.keywordLUT = {};
        this.battleTacticCards = [];
        this._parseKeywords();
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
        });
    }
}