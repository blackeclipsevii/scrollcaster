import bsTextSmoother from "./lib/BsSmoother.js"
import { AbilityType } from "../shared/AbilityType.js";

export default class Ability {
    constructor(profile) {
        this.name = profile['@name'];
        profile.characteristics.forEach((char) => {
            const lcName = char['@name'].toLowerCase();
            if (lcName !== 'used by') {
                const value = bsTextSmoother(char['#text']);
                this[lcName] = value ? value : null;
            }
        });

        profile.attributes.forEach((attrib) => {
            if (attrib['@name'] === 'Color') {
                this.color = attrib['#text'];
            }
        });

        if (profile['@typeName'].includes('Activated')) {
            this.type = AbilityType.Active;
        } 
        else if (profile['@typeName'].includes('Passive')) {
            this.type = AbilityType.Passive;
        }
        else if (profile['@typeName'].includes('Spell')) {
            this.type = AbilityType.Spell;
            this.cost = profile.characteristics['Casting Value'];
        }
        else if (profile['@typeName'].includes('Prayer')) {
            this.type = AbilityType.Prayer;
            this.cost = profile.characteristics['Chanting Value'];
        }
        else if (profile['@typeName'].includes('Command')) {
            this.type = AbilityType.Command;
        }
    }
}