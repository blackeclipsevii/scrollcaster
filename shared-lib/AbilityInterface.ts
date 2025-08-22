import { Identifiable, Typed } from "./BasicObject.js";

export const AbilitySuperType = 'Ability';

export enum AbilityType {
    Active = 0,
    Passive = 1,
    Spell = 2,
    Command = 3,
    Prayer = 4
}

export default interface AbilityInterf extends Identifiable, Typed {
  [name: string]: string | number;
  abilityType: string;
  timing: string;
  color: string;
  effect: string;
  declare: string;
  cost: number;
  keywords: string;
}