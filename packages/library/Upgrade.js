import Ability from "./Ability.js";

// to-do make a shared library
// these might be hardcoded in the app
export const UpgradeType = {
    Artifact: 0,
    HeroicTrait: 1,
    BattleFormation: 2,
    SpellLore: 3,
    ManifestationLore: 4,
    BattleTraits: 5,
    PrayerLore: 6
}

export default class Upgrade {
    constructor (selectionEntry, type) {
        this.name = selectionEntry['@name'];
        this.type = type;
        this.abilities = [];
        if (selectionEntry.profiles) {
            selectionEntry.profiles.forEach(profile => {
                this.abilities.push(new Ability(profile));
            })
        }
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