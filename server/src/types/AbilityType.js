
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
    Command: 3,
    Prayer: 4
}
