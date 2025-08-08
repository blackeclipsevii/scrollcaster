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
    expect(unit.models[0].weapons.selections.length).toEqual(2);
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

test('Multiple model types', () =>{
    const aos = getAos();
    let army = aos.getArmy('Cities of Sigmar');
    expect(army).toBeTruthy();
    let unit = army.units['9e34-2f0c-69ff-e722'];
    expect(unit.name).toEqual('Freeguild Command Corps');
    expect(unit).toBeTruthy();
    expect(unit.models.length).toBe(6);
});

test('Weapon selections', () => {
    const aos = getAos();
    let army = aos.getArmy('Kharadron Overlords');
    expect(army).toBeTruthy();
    let unit = army.units['4c3c-1a00-2c49-87ce'];
    expect(unit.name).toEqual('Endrinriggers');
    expect(unit).toBeTruthy();
    let model = unit.models[0];
    expect(model.weapons.selections.length).toEqual(2);
    expect(model.weapons.selectionSets.length).toEqual(2);
    expect(model.weapons.selectionSets[0].options.length).toEqual(3);
    let names = model.weapons.selectionSets[0].options.map(option => option.name);
    expect(names).toEqual([
        "Skyrigger Heavy Weapon and Gun Butt",
        "Rapid-fire Rivet Gun",
        "Aethermatic Saw"
    ]);
    
    army = aos.getArmy('Seraphon');
    expect(army).toBeTruthy();
    unit = army.units['9544-33d8-1d69-2be9'];
    expect(unit.name).toEqual('Kroxigor');
    expect(unit).toBeTruthy();
    model = unit.models[0];
    expect(model.weapons.selections.length).toEqual(1);
    expect(model.weapons.selectionSets.length).toEqual(1);
    expect(model.weapons.selectionSets[0].options.length).toEqual(2);
    names = model.weapons.selectionSets[0].options.map(option => option.name);
    expect(names).toEqual([
        "Moonstone Hammer",
        "Drakebite Maul",
    ]);
});