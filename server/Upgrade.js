import Ability from "./Ability.js";

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