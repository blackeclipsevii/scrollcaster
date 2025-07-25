
import bsTextSmoother from "./lib/BsSmoother.js";

import { WeaponType } from "./types/WeaponType.js";

export default class Weapon {
    constructor(profileXml) {
        this.name = profileXml['@name'];
        if (profileXml['@typeName'].includes("Ranged"))
            this.type = WeaponType.Ranged;
        else
            this.type = WeaponType.Melee;
        const chars = profileXml.characteristics;
        for (let i = 0; i < chars.length; ++i) {
            const char = chars[i];
            const cName = new String(char['@name']).trim();
            const value = bsTextSmoother(char['#text']);
            this[cName] = value ? value.toString() : '-';
        }
    }
}