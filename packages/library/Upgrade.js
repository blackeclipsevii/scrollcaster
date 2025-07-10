import Ability from "./Ability.js";

export const UpgradeType = {
    Artifact: 0,
    HeroicTrait: 1,
    BattleFormation: 2,
    SpellLore: 3,
    ManifestationLore: 4
}

export default class Upgrade {
    constructor (selectionEntry) {
        this.name = selectionEntry['@name'];
        this.ability = new Ability(selectionEntry.profiles[0]);
        this.points = 0;
        if (selectionEntry.costs) {
            selectionEntry.costs.forEach((cost) => {
                if (cost['@name'] === 'pts') {
                    this.points = Number(cost['@value']);
                }
            });
        }
    }
}