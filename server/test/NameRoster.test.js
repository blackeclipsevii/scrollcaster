import AgeOfSigmar from "../dist/src/AgeOfSigmar.js";
import { nameRosterToRoster } from "../dist/src/lib/NameRoster.js";
import RosterStateConverter from "../dist/src/lib/RosterStateConverterImpl.js"
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

    const rsc = new RosterStateConverter(aos);
    const json = rsc.serialize(roster);
    const state = JSON.parse(json);
    expect(state.name).toBe('Gordrakk Kragnos');
    expect(state.regiments.length).toBe(4);
    expect(state.regiments[0].units[0].isReinforced).toBe(false);
    expect(state.battleTacticCards.length).toBe(2);
    expect(state.lores.spell).toBeTruthy();
    expect(state.lores.prayer).toBeTruthy();
    expect(state.lores.manifestation).toBeTruthy();
});

test('nameRosterToRoster convert weapons', async () => {
    const aos = getAos();
    nameRosterStr = `{"name":"Kharadron Overlords","armyName":"Kharadron Overlords","battleFormation":"Endrineers Guild Expeditionary Force","battleTacticCards":["Master the Paths","Intercept and Recover"],"lores":{"manifestation":"Aetherwrought Machineries"},"factionTerrain":"Zontari Endrin Dock","regimentOfRenown":"Fjori's Flamebearers","regiments":[[{"name":"Endrinriggers","isGeneral":false,"isReinforced":true,"other":["2x Skyrigger Heavy Weapon and Gun Butt","1x Aethermatic Volley Gun and Gun Butt"]}],[{"name":"Aether-Khemist","isGeneral":false,"isReinforced":false,"other":[]}]],"auxUnits":[{"name":"Arkanaut Frigate","isGeneral":false,"isReinforced":false,"other":[]}]}`
    const roster = nameRosterToRoster(aos, JSON.parse(nameRosterStr));
    expect(roster).toBeTruthy();
    expect(roster.regiments.length).toEqual(2);
    expect(roster.regiments[0].units.length).toEqual(1);
    const unit = roster.regiments[0].units[0];
    expect(unit).toBeTruthy();
    expect(unit.models[0].weapons.selected).toEqual( {
      "Aethermatic Volley Gun and Gun Butt": 1,
      "Skyrigger Heavy Weapon and Gun Butt": 2,
    });
});