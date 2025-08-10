export const AbilitySuperType = 'Ability';

export enum AbilityType {
    Active = 0,
    Passive = 1,
    Spell = 2,
    Command = 3,
    Prayer = 4
}

export default interface AbilityInterf {
    name: string;
    id: string;
    metadata: {[key: string]: string};
    type: number;
    cost: number | null;
}