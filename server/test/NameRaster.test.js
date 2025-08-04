import AgeOfSigmar from "../dist/AgeOfSigmar.js";
import { nameRosterToRoster } from "../dist/lib/NameRoster";
import { RosterState } from "../dist/lib/RosterState.js"
import path from 'path'

const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");

var _aos = null;
const getAos = () => {
    if (!_aos)
        _aos = new AgeOfSigmar(directoryPath);
    return _aos;
}

test('Import name roster', () => {
    const aos = getAos();
    const input = '{"name":"Gordrakk Kragnos","armyName":"Ironjawz","battleFormation":null,"battleTacticCards":["Restless Energy","Wrathful Cycles"],"lores":{"spell":null,"prayer":null,"manifestation":"Manifestations of Gorkamorka"},"factionTerrain":"Bossrokk Tower","regiments":[[{"name":"Gordrakk, the Fist of Gork","isGeneral":true,"isReinforced":false,"artifact":null,"heroicTrait":null,"monstrousTrait":null,"other":[]},{"name":"Weirdbrute Wrekkaz","isGeneral":false,"isReinforced":false,"artifact":null,"heroicTrait":null,"monstrousTrait":null,"other":[]},{"name":"Weirdbrute Wrekkaz","isGeneral":false,"isReinforced":false,"artifact":null,"heroicTrait":null,"monstrousTrait":null,"other":[]}],[{"name":"Kragnos, the End of Empires","isGeneral":false,"isReinforced":false,"artifact":null,"heroicTrait":null,"monstrousTrait":null,"other":[]}],[{"name":"Megaboss on Maw-krusha","isGeneral":false,"isReinforced":false,"artifact":null,"heroicTrait":null,"monstrousTrait":null,"other":[]},{"name":"Weirdbrute Wrekkaz","isGeneral":false,"isReinforced":true,"artifact":null,"heroicTrait":null,"monstrousTrait":null,"other":[]}],[{"name":"Warchanter","isGeneral":false,"isReinforced":false,"artifact":null,"heroicTrait":null,"monstrousTrait":null,"other":[]}]],"auxUnits":[]}';
    const nameRoster = JSON.parse(input);
    const roster = nameRosterToRoster(aos, nameRoster);
    expect(roster).toBeTruthy();
    expect(roster.name).toBe('Gordrakk Kragnos');
    expect(roster.regiments.length).toBe(4);
    expect(roster.regiments[0].units[0].isReinforced).toBe(false);
    expect(roster.battleTacticCards.length).toBe(2);
    expect(roster.lores.spell).toBeTruthy();
    expect(roster.lores.prayer).toBeTruthy();
    expect(roster.lores.manifestation).toBeTruthy();

    const json = RosterState.serialize(roster);
    const state = JSON.parse(json);
    expect(state.name).toBe('Gordrakk Kragnos');
    expect(state.regiments.length).toBe(4);
    expect(state.regiments[0].units[0].isReinforced).toBe(false);
    expect(state.battleTacticCards.length).toBe(2);
    expect(state.lores.spell).toBeTruthy();
    expect(state.lores.prayer).toBeTruthy();
    expect(state.lores.manifestation).toBeTruthy();
});