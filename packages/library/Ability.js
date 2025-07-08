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
        const chars = profile.characteristics;
        
        for (let i = 0; i < chars.length; ++i) {
            const char = chars[i];
            const lcName = char['@name'].toLowerCase();
            if (lcName === 'used by')
                continue;
            const value = bsTextSmoother(char['#text']);
            this[lcName] = value ? value : null;
        }

        if (profile['@typeName'] === 'Ability (Activated)') {
            this.type = AbilityType.Active;
        } 
        else if (profile['@typeName'] === 'Ability (Passive)') {
            this.type = AbilityType.Passive;
        }
        else if (profile['@typeName'] === 'Ability (Spell)') {
            this.type = AbilityType.Spell;
            this.cost = profile.characteristics['Casting Value'];
        }
        else if (profile['@typeName'] === 'Ability (Command)') {
            this.type = AbilityType.Command;
        }
    }
}