import bsTextSmoother from "./BsSmoother.js"

export const AbilityTiming = {
    StartOfTurn: 0,
    HeroPhase: 1,
    MovementPhase: 2,
    ShootingPhase: 3,
    ChargePhase: 4,
    CombatPhase: 5,
    EndOfTurn: 6,
    Passive: 7
}

export const AbilityTimingConstraint = {
    None: 0,
    Enemy: 1,
    Your: 2
}

export const AbilityLimit = {
    Unlimited: 0,
    OncePerTurn: 1,
    OncePerGame: 2
}

export const AbilityType = {
    Active: 0,
    Passive: 1,
    Spell: 2,
    Command: 3
}

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
        else if (profile['@typeName'].includes('Command')) {
            this.type = AbilityType.Command;
        }
    }
}