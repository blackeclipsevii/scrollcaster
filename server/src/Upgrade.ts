import Ability from "./Ability.js";

import { BsCost, BsProfile, BsSelectionEntry } from "./lib/bs/BsCatalog.js"

export default class Upgrade {
    name: string;
    id: string;
    type: number;
    abilities: Ability[];
    points: number;
    constructor (selectionEntry: BsSelectionEntry, type: number) {
        this.name = selectionEntry['@name'];
        this.id = selectionEntry["@id"];
        this.type = type;
        this.abilities = [];
        if (selectionEntry.profiles) {
            const profiles: BsProfile[] = selectionEntry.profiles;
            profiles.forEach(profile => {
                this.abilities.push(new Ability(profile));
            })
        }
        this.points = 0;
        if (selectionEntry.costs) {
            const costs: BsCost[] = selectionEntry.costs;
            costs.forEach((cost) => {
                if (cost['@name'] === 'pts') {
                    this.points = Number(cost['@value']);
                }
            });
        }
    }
}