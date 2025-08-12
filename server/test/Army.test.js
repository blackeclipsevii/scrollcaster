import AgeOfSigmar from "../dist/src/AgeOfSigmar.js";
import path from 'path'

const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");

var _aos = null;
const getAos = () => {
    if (!_aos)
        _aos = new AgeOfSigmar(directoryPath);
    return _aos;
}

test('Monstrous Traits', () => {
    const aos = getAos();
    const army = aos.getArmy('Ironjawz');
    expect(army).toBeTruthy();
    expect(Object.getOwnPropertyNames(army.upgrades.enhancements)).toEqual([
        'artefactsOfPower',
        "heroicTraits",
        "monstrousTraits"
    ]);
    const traits = Object.getOwnPropertyNames(army.upgrades.enhancements.monstrousTraits.upgrades);
    expect(traits).toEqual([
        "Fast 'Un",
        "Mad 'Un",
        "Big 'Un",
    ]);
});

test('Prayer Manifestations', () => {
    const aos = getAos();
    const army = aos.getArmy('Fyreslayers');
    expect(army).toBeTruthy();
    const manifestation = army.upgrades.lores.manifestation;
    expect(Object.getOwnPropertyNames(manifestation)).toEqual([
        "UNIVERSAL-Aetherwrought Machineries",
        "UNIVERSAL-Forbidden Power",
        "UNIVERSAL-Krondspine Incarnate",
        "UNIVERSAL-Morbid Conjuration",
        "UNIVERSAL-Twilit Sorceries",
        "UNIVERSAL-Primal Energy",
        "Magmic Invocations"
    ]);

    const prayerManifest = manifestation["Magmic Invocations"];
    expect(prayerManifest.abilities.length).toEqual(3);
});