import AgeOfSigmar from "../dist/AgeOfSigmar.js";
import path from 'path'

const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");

var _aos = null;
const getAos = () => {
    if (!_aos)
        _aos = new AgeOfSigmar(directoryPath);
    return _aos;
}

test('Optional wargear', () => {
    const aos = getAos();
    let army = aos.getArmy('Slaves to Darkness');
    expect(army).toBeTruthy();
    // chaos chariot has wargear options
    let unit = army.units['e161-b68c-7d8c-9513'];
    expect(unit.name).toEqual('Chaos Chariot');
    expect(unit).toBeTruthy();
    expect(unit.models[0].weapons.length).toEqual(2);
    expect(unit.models[0].optionSets.length).toEqual(1);

    unit = army.units['22ef-99c8-eb17-973f'];
    expect(unit.name).toEqual('Daemon Prince');
    expect(unit).toBeTruthy();
    expect(unit.optionSets.length).toEqual(2);

    // steggadon warchief is acting up
    army = aos.getArmy('Seraphon');
    unit = army.units['cd8a-43c6-6598-bd0a'];
    expect(unit.name).toEqual('Stegadon Chief');
    expect(unit).toBeTruthy();
    expect(unit.models[0].optionSets.length).toEqual(1);
    expect(Object.getOwnPropertyNames(unit.models[0].optionSets[0].options)).toEqual([
       "Skystreak Bow",
       "Sunfire Throwers",
    ]);
});
