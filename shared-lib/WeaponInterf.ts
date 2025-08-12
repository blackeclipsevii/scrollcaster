
export enum WeaponType {
    Melee = 0,
    Ranged = 1
}

// The profile for a weapon
export default interface WeaponInterf {
    [name: string]: string | number | null;
    id: string;
    name: string;
    type: number;
    Rng: string | null;
    Atk: string;
    Hit: string;
    Wnd: string;
    Rnd: string;
    Dmg: string;
    Ability: string;
}

export enum WeaponSelectionPer {
    // the weapon selection is per model (every model can have n)
    Model = "Model",
    // per unit (every MIN unit can have n)
    Unit = "Unit"
}

export interface WeaponSelectionInterf {
    // the name of the selection
    name: string;
    // the id of the selection
    id: string;
    // the min number that can be included
    min: number;
    // the max number that can be included
    max: number;
    // per model / unit
    per: WeaponSelectionPer;
    // the weapon id(s) this weapon/weapons will replace
    replaces: string[];
    // the weapons profiles associated with this selection
    weapons: WeaponInterf[];
}

// maybe overkill
export interface WeaponsInterf {
    // weapons that are just kind of there
    warscroll: WeaponInterf[];
    // weapons that are selected by the user
    selected: WeaponInterf[];
    // all the weapon options
    selections: {[name: string]: WeaponSelectionInterf};
}