
// Name based representation of a unit
// Used for import from various list formats
export interface NameUnit {
    name: string;
    isGeneral: boolean;
    isReinforced: boolean;
    other: string[];
};

// Name based representation of a roster
// Used for import from various list formats
export interface NameRoster {
    name: string;
    armyName: string;
    battleFormation: string | null;
    battleTacticCards: string[];
    lores: {
        [name: string]: string | null;
    };
    factionTerrain: string | null;
    regimentOfRenown: string | null;
    regiments: (NameUnit[])[];
    auxUnits: NameUnit[];
};
