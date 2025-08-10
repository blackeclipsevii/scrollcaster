import { BsProfile } from "./lib/bs/BsCatalog.js";
import bsTextSmoother from "./lib/bs/BsSmoother.js"
import { AbilityType } from "../shared-lib/AbilityInterface.js";

import { bsCharacteristicArrToMetadata, Metadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";

export default class Ability {
    name: string;
    id: string;
    metadata: Metadata;
    type: number;
    cost: number | null;
    constructor(profile: BsProfile) {
        this.name = profile['@name'];
        this.id = profile['@id'];
        this.metadata = {};
        this.type = AbilityType.Passive;
        this.cost = null;
        profile.characteristics.forEach((char) => {
            const lcName = char['@name'].toLowerCase();
            if (lcName !== 'used by' && char['#text']) {
                const value = bsTextSmoother(char['#text']);
                (this as unknown as Metadata)[lcName] = value;
            }
        });

        if (profile.attributes) {
            profile.attributes.forEach((attrib) => {
                if (attrib['#text'])
                    this.metadata[attrib['@name'].toLowerCase()] = attrib['#text'];
            });
        }
        
        const charsMd = bsCharacteristicArrToMetadata(profile.characteristics);

        if (profile['@typeName'].includes('Activated')) {
            this.type = AbilityType.Active;
        } 
        else if (profile['@typeName'].includes('Passive')) {
            this.type = AbilityType.Passive;
        }
        else if (profile['@typeName'].includes('Spell')) {
            this.type = AbilityType.Spell;
            this.cost = Number(charsMd['Casting Value']);
        }
        else if (profile['@typeName'].includes('Prayer')) {
            this.type = AbilityType.Prayer;
            this.cost = Number(charsMd['Chanting Value']);
        }
        else if (profile['@typeName'].includes('Command')) {
            this.type = AbilityType.Command;
        }
    }
}