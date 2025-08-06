
// Name based representation of a unit
// Used for import from various list formats
class NameUnit {
    constructor() {
        this.name = '';
        this.isGeneral = false;
        this.isReinforced = false;
        // this.enhancements = {};
        this.other = [];
    }
};

// Name based representation of a roster
// Used for import from various list formats
class NameRoster {
    constructor(){
        this.name = '';
        this.armyName = '';
        this.battleFormation = null;
        this.battleTacticCards = [];
        this.lores = {
            spell: null,
            prayer: null,
            manifestation: null
        };
        this.factionTerrain = null;
        this.regimentOfRenown = null;
        this.regiments = [];
        this.auxUnits = [];
    }
};

const nameRosterToRoster = async (nameRoster) => {
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