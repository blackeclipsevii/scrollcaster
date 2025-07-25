
import bsTextSmoother from './lib/bs/BsSmoother.js';

import { BattleTacticType } from './types/BattleTacticType.js';

export class BattleTactic {
    constructor (type, text) {
        this.type = type;
        this.text = bsTextSmoother(text);
        this.text = `<b>${this.text.replace(':', ':</b>')}`;
    }
}

export default class BattleTacticCard {
    constructor(entry) {
        this.name = entry['@name'];
        this.text = '';
        this.tactics = [null, null, null];
        entry.profiles[0].characteristics.forEach(phase => {
            if (phase['@name'] === 'Card') {
                const text = phase['#text'];
                this.text = text ? bsTextSmoother(text) : '';
            } else if (phase['@name'] === BattleTacticType.Affray.name) {
                this.tactics[BattleTacticType.Affray.index] = 
                    new BattleTactic(BattleTacticType.Affray, phase['#text']);
            } else if (phase['@name'] === BattleTacticType.Strike.name) {
                this.tactics[BattleTacticType.Strike.index] = 
                    new BattleTactic(BattleTacticType.Strike, phase['#text']);
            } else if (phase['@name'] === BattleTacticType.Domination.name) {
                this.tactics[BattleTacticType.Domination.index] = 
                    new BattleTactic(BattleTacticType.Domination, phase['#text']);
            }
        })
    }
}