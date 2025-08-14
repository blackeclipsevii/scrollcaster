
import AgeOfSigmar from "../dist/src/AgeOfSigmar.js";
import RosterStateConverter from "../dist/src/lib/RosterStateConverterImpl.js"
import path from 'path'

const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");

var _aos = null;
const getAos = () => {
    if (!_aos)
        _aos = new AgeOfSigmar(directoryPath);
    return _aos;
}

test('deserialize weapon selections', async () => {
    const serialState = '{"name":"Kharadron Overlords","army":"Kharadron Overlords","auxUnits":[{"unit":"fb94-3fa7-35ae-7a3c","isGeneral":false,"isReinforced":false,"enhancements":{},"options":{},"models":{"ce96-b01f-e52f-c799":{"weapons":{},"options":{}}}}],"regimentOfRenown":"a723-1314-55da-86d8","battleFormation":"b0e7-29b-1533-9456","regiments":[{"leader":null,"units":[{"unit":"4c3c-1a00-2c49-87ce","isGeneral":false,"isReinforced":true,"enhancements":{},"options":{},"models":{"1c1a-b369-b36d-cbe4":{"weapons":{"Skyrigger Heavy Weapon and Gun Butt":2,"Aethermatic Volley Gun and Gun Butt":1},"options":{}}}}]},{"leader":{"unit":"26a7-80ea-22a-21ca","isGeneral":false,"isReinforced":false,"enhancements":{},"options":{},"models":{"64ac-416d-1b4d-60a7":{"weapons":{},"options":{}}}},"units":[]}],"battleTacticCards":["f5d1-f1d9-1dd5-5061","545c-5467-b8b6-2b1b"],"lores":{"spell":null,"prayer":null,"manifestation":"3418-2751-2ef4-82e8"},"terrainFeature":"2c4d-116f-02a1-88ce"}';
    const rsc = new RosterStateConverter(getAos());
    const roster = await rsc.deserialize(serialState, 'whocares');
    expect(roster).toBeTruthy();
    expect(roster.regiments.length).toEqual(2);
    expect(roster.regiments[0].units.length).toEqual(1);
    const unit = roster.regiments[0].units[0];
    expect(unit.models[0].weapons.selected).toEqual({
      "Aethermatic Volley Gun and Gun Butt": 1,
      "Skyrigger Heavy Weapon and Gun Butt": 2,
    });
});