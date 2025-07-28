
import { BsSelectionEntry } from './lib/bs/BsCatalog.js';
import bsTextSmoother from './lib/bs/BsSmoother.js';

export const BattleTacticType = {
    Affray: 0,
    Strike: 1,
    Domination: 2
}

export class BattleTactic {
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
        this.text = bsTextSmoother(text);
        this.text = `<b>${this.text.replace(':', ':</b>')}`;
    }
}

export default class BattleTacticCard {
    name: string;
    id: string;
    text: string;
    tactics: BattleTactic[];

    constructor(entry: BsSelectionEntry) {
        this.name = entry['@name'];
        this.id = entry['@id'];
        this.text = '';
        this.tactics = [
            new BattleTactic('Affray', 0, ''),
            new BattleTactic('Strike', 1, ''),
            new BattleTactic('Domination', 2, '')
        ];
        if (entry.profiles === undefined) {
            throw 'Battle Tactic Card is missing profiles.';
        }
        entry.profiles[0].characteristics.forEach(phase => {
            if (phase['#text'] === undefined)
                return;

            if (phase['@name'] === 'Card') {
                const text = phase['#text'];
                this.text = text ? bsTextSmoother(text) : '';
            } else if (phase['@name'] === 'Affray') {
                this.tactics[0].text = phase['#text'];
            } else if (phase['@name'] === 'Strike') {
                this.tactics[1].text = phase['#text'];
            } else if (phase['@name'] === 'Domination') {
                this.tactics[2].text = phase['#text'];
            }
        })
    }
}