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
    const army = aos.getArmy('Slaves to Darkness');
    expect(army).toBeTruthy();
    // chaos chariot has wargear options
    const unit = army.units['e161-b68c-7d8c-9513'];
    expect(unit.name).toEqual('Chaos Chariot');
    expect(unit).toBeTruthy();
    expect(unit.weapons.length).toEqual(2);
    expect(unit.weaponOptions.length).toEqual(1);
});
