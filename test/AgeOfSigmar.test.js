import AgeOfSigmar from "../server/AgeOfSigmar.js";
import path from 'path'

const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");

var gAos = null;

test('initialize AgeOfSigmar', () => {
    gAos = new AgeOfSigmar(directoryPath)
    expect(gAos.getArmyNames()).toEqual([
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