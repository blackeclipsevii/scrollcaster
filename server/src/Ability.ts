import { BsProfile } from "./lib/bs/BsCatalog.js";
import bsTextSmoother from "./lib/bs/BsSmoother.js"
import AbilityInterf, { AbilitySuperType, AbilityType } from "../shared-lib/AbilityInterface.js";

import { bsCharacteristicArrToMetadata, Metadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";

export default class Ability implements AbilityInterf {
    [name: string]: string | number;
    name: string;
    id: string;
    type: AbilityType;
    superType: string;
    abilityType: string;
    timing: string;
    color: string;
    effect: string;
    declare: string;
    cost: number;
    keywords: string;
    constructor(profile: BsProfile) {
        this.name = profile['@name'];
        this.id = profile['@id'];
        this.type = AbilityType.Passive;
        this.superType = AbilitySuperType;
        this.cost = 0;
        this.timing = 'Passive';
        this.color = 'gray';
        this.effect = '';
        this.declare = '';
        this.abilityType = '';
        this.keywords = '';

        profile.characteristics.forEach((char) => {
            const lcName = char['@name'].toLowerCase();
            if (lcName !== 'used by' && char['#text']) {
                const value = bsTextSmoother(char['#text']);
                if (value)
                    this[lcName] = value;
            }
        });

        if (profile.attributes) {
            profile.attributes.forEach((attrib) => {
                //if (attrib['#text'])
                //    this.metadata[attrib['@name'].toLowerCase()] = attrib['#text'];
                if (attrib['#text']) {
                    const lcName = attrib['@name'].toLowerCase();
                    if (lcName === 'color') {
                        this.color = attrib['#text'];
                    } else if (lcName === 'type') {
                        this.abilityType = attrib['#text'];
                    }
                }
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