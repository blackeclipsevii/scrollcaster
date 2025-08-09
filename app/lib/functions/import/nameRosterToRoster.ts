// Name based representation of a unit
// Used for import from various list formats
interface NameUnit {
    name: string;
    isGeneral: boolean;
    isReinforced: boolean;
    other: string[];
};

// Name based representation of a roster
// Used for import from various list formats
interface NameRoster {
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

const nameRosterToRoster = async (nameRoster: NameRoster) => {
    const regArg = encodeURI(`${endpoint}/import`);
    let result = await fetch(regArg, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(nameRoster)
    })
    .then(response => {
        if (response.status === 200) 
            return response.json();
        else {
            console.log(`Server failed to import ${nameRoster.name}`);
            return null;
        }
    });

    if (result)
        result = rosterState.deserialize(result);
    return result;
}