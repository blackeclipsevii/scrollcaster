import AgeOfSigmar from "../server/AgeOfSigmar.js";
import path from 'path'

const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");

var _aos = null;
const getAos = () => {
    if (!_aos)
        _aos = new AgeOfSigmar(directoryPath);
    return _aos;
}

test('initialize AgeOfSigmar', () => {
    const aos = getAos();
    expect(aos.getArmyNames()).toEqual([
        "Blades of Khorne",
        "Cities of Sigmar",
        "Daughters of Khaine - The Croneseer's Pariahs",
        "Daughters of Khaine",
        "Disciples of Tzeentch - Pyrofane Cult",
        "Disciples of Tzeentch",
        "Flesh-eater Courts",
        "Fyreslayers - Lofnir Drothkeepers",
        "Fyreslayers",
        "Gloomspite Gitz - Da King's Gitz",
        "Gloomspite Gitz - Droggz's Gitmob",
        "Gloomspite Gitz - Trugg's Troggherd",
        "Gloomspite Gitz",
        "Hedonites of Slaanesh",
        "Idoneth Deepkin - The First Phalanx of Ionrach",
        "Idoneth Deepkin - Wardens of the Chorrileum",
        "Idoneth Deepkin",
        "Ironjawz - Big Waaagh!",
        "Ironjawz - Krazogg's Grunta Stampede",
        "Ironjawz - Zoggrok's Ironmongerz",
        "Ironjawz",
        "Kharadron Overlords - Grundstok Expeditionary Force",
        "Kharadron Overlords",
        "Kruleboyz - Big Waaagh!",
        "Kruleboyz - Murkvast Menagerie",
        "Kruleboyz",
        "Lumineth Realm-lords",
        "Maggotkin of Nurgle",
        "Nighthaunt",
        "Ogor Mawtribes - The Roving Maw",
        "Ogor Mawtribes",
        "Ossiarch Bonereapers",
        "Seraphon",
        "Skaven - Thanquol's Mutated Menagerie",
        "Skaven - The Great-grand Gnawhorde",
        "Skaven",
        "Slaves to Darkness - Legion of the First Prince",
        "Slaves to Darkness - The Swords of Chaos",
        "Slaves to Darkness - Tribes of the Snow Peaks",
        "Slaves to Darkness",
        "Sons of Behemat - King Brodd's Stomp",
        "Sons of Behemat",
        "Soulblight Gravelords - Barrow Legion",
        "Soulblight Gravelords - Knights of the Crimson Keep",
        "Soulblight Gravelords - Scions of Nulahmia",
        "Soulblight Gravelords",
        "Stormcast Eternals - Draconith Skywing",
        "Stormcast Eternals - Heroes of the First-Forged",
        "Stormcast Eternals - Ruination Brotherhood",
        "Stormcast Eternals",
        "Sylvaneth - The Evergreen Hunt",
        "Sylvaneth"
    ]);
});

test('Morathi regiment options', () =>{
    // (required)
    const aos = getAos();
    const dok = aos.getArmy('Daughters of Khaine');
    expect(dok).toBeTruthy();
    const morathiId = "cb92-4063-ab41-97d5";
    const morathiUnit = dok.units[morathiId];
    expect(morathiUnit).toBeTruthy();
    expect(morathiUnit.name).toEqual("Morathi-Khaine")
    const unitOptions = aos.getRegimentOptions(dok, morathiId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
        "The Shadow Queen",
        "High Gladiatrix",
        "Melusai Ironscale",
        "Avatar of Khaine",
        "Blood Sisters",
        "Doomfire Warlocks",
        "Blood Stalkers",
        "Khainite Shadowstalkers",
        "Khinerai Heartrenders",
        "Sisters of Slaughter with Bladed Bucklers",
        "Khinerai Lifetakers",
        "Sisters of Slaughter with Sacrificial Knives",
        "Witch Aelves with Paired Sciansá",
        "Witch Aelves with Bladed Bucklers"
    ]);
});

test('Skink Starpriest regiment options', () =>{
    // non-MONSTER Skink
    const aos = getAos();
    const army = aos.getArmy('Seraphon');
    expect(army).toBeTruthy();

    const leaderId = "abb5-c657-a20e-6e47";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Skink Starpriest")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
        "Bastiladon with Ark of Sotek",
        "Bastiladon with Solar Engine",
        "Engine of the Gods",
        "Hunters of Huanchi with Dartpipes",
        "Hunters of Huanchi with Starstone Bolas",
        "Kroxigor",
        "Kroxigor Warspawned",
        "Raptadon Chargers",
        "Raptadon Hunters",
        "Ripperdactyl Riders",
        "Skinks",
        "Spawn of Chotec",
        "Stegadon",
        "Terradon Riders",
        "Terrawings",
    ]);
});

test('Akhelian King regiment options', () =>{
    // ' or '
    const aos = getAos();
    const army = aos.getArmy('Idoneth Deepkin');
    expect(army).toBeTruthy();

    const leaderId = "1d8e-2553-5bf3-901b";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Akhelian King")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names.length).toEqual(13);
    expect(names).toEqual([
        "Akhelian Thrallmaster",
        "Isharann Soulrender",
        "Isharann Soulscryer",
        "Akhelian Allopex",
        "Akhelian Ishlaen Guard",
        "Akhelian Leviadon",
        "Akhelian Morrsarr Guard",
        "Namarti Reavers",
        "Namarti Thralls",
        "Akhelian Thrallmaster (Scourge of Ghyran)",
        "Namarti Thralls (Scourge of Ghyran)",
        "Ikon of the Sea",
        "Ikon of the Storm",
    ]);
});

test('Scinari Enlightener regiment options', () =>{
    // specific unit name allowed
    const aos = getAos();
    const army = aos.getArmy('Lumineth Realm-lords');
    expect(army).toBeTruthy();

    const leaderId = "c36-bd13-c06d-5fe";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Scinari Enlightener")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    //expect(names.length).toEqual(13);
    expect(names).toEqual([
        "Ydrilan Riverblades",
        "Vanari Bladelords",
        "Vanari Auralan Wardens"
    ]);
});