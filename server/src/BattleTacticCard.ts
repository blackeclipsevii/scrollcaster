
import BattleTacticCardInterf, { BattleTacticInterf } from '../shared-lib/BattleTacticCardInterf.js';
import { OtherSuperType, OtherTypes } from '../shared-lib/OtherTypes.js';
import { BsSelectionEntry } from './lib/bs/BsCatalog.js';
import bsTextSmoother from './lib/bs/BsSmoother.js';

export class BattleTactic implements BattleTacticInterf {
    type: {
        name: string;
        index: number;
    };
    text: string;
    constructor (name: string, index: number, text: string) {
        this.type = {
            name: name,
            index: index
        };
        this.text = '';
        this.addText(text);
    }

    addText(text: string) {
        this.text = bsTextSmoother(text) as string;
        this.text = `<b>${this.text.replace(':', ':</b>')}`;
    }
}

export default class BattleTacticCard implements BattleTacticCardInterf {
    name: string;
    id: string;
    type: number;
    superType: string;
    text: string;
    tactics: BattleTactic[];

    constructor(entry: BsSelectionEntry) {
        this.name = entry['@name'];
        this.id = entry['@id'];
        this.type = OtherTypes.BattleTacticCard;
        this.superType = OtherSuperType;
        this.text = '';
        this.tactics = [
            new BattleTactic('Affray', 0, ''),
            new BattleTactic('Strike', 1, ''),
            new BattleTactic('Domination', 2, '')
        ];
        if (entry.profiles === undefined) {
            throw new Error('Battle Tactic Card is missing profiles.');
        }
        entry.profiles[0].characteristics.forEach(phase => {
            if (phase['#text'] === undefined)
                return;

            if (phase['@name'] === 'Card') {
                const text = phase['#text'];
                this.text = text ? bsTextSmoother(text) as string : '';
            } else if (phase['@name'] === 'Affray') {
                this.tactics[0].addText(phase['#text'].toString());
            } else if (phase['@name'] === 'Strike') {
                this.tactics[1].addText(phase['#text'].toString());
            } else if (phase['@name'] === 'Domination') {
                this.tactics[2].addText(phase['#text'].toString());
            }
        })
    }
}