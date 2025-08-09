
export enum WeaponType {
    Melee = 0,
    Ranged = 1
}

export default interface WeaponInterf {
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

export interface WeaponSelection {
    name: string;
    id: string;
    min: number;
    max: number;
    per: string;
    replacedBy: string[];
    weapons: WeaponInterf[];
}

export interface WeaponSelectionSet {
    options: WeaponSelection[];
}

// maybe overkill
export interface WeaponsInterf {
    // always there
    warscroll: WeaponInterf[];
    // selectable, doesn't affect others
    selections: WeaponSelection[];
    // exclusive
    selectionSets: WeaponSelectionSet[];
}