import AgeOfSigmar from "../dist/AgeOfSigmar.js";
import { RegimentValidator } from "../dist/lib/validation/RegimentValidation.js";
import { deserializeRegiment } from "../dist/lib/RosterState.js";
import path from 'path'

const directoryPath = path.resolve("./data/age-of-sigmar-4th-main");

var _aos = null;
const getAos = () => {
    if (!_aos)
        _aos = new AgeOfSigmar(directoryPath);
    return _aos;
}

const validateSerializedRegiment = (sReg, army, keywords) => {
    sReg.leader = {
        unit: sReg.leader,
        enhancements: {}
    };
    for (let i = 0; i < sReg.units.length; ++i) {
        sReg.units[i] = {
            unit: sReg.units[i],
            enhancements: {}
        };
    }
    const reg = deserializeRegiment(army, sReg);
    return RegimentValidator.validateRegiment(reg, keywords);
}

test('initialize AgeOfSigmar', () => {
    const aos = getAos();
    const alliances = aos.getArmyAlliances();
    const names = [];
    alliances.forEach(alliance => names.push(alliance.name));
    names.sort((a,b) => a.localeCompare(b));
    const truth = [
        "Blades of Khorne - Gorechosen Champions",
        "Blades of Khorne - The Baleful Lords",
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
        "Kharadron Overlords - Pioneer Outpost",
        "Kharadron Overlords - The Magnate's Crew",
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
    ];
    truth.sort((a,b) => a.localeCompare(b));
    expect(names).toEqual(truth);
});

test('Morathi regiment options', () =>{
    // (required)
    const aos = getAos();
    const dok = aos.getArmy('Daughters of Khaine');
    const keywords = aos._getAvailableKeywords(dok);
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

    
    // morathi requires the shadow queen
    const invalidRegiment ={ 
        leader: morathiUnit.id,
        units: []
    };

    let errorMsgs = validateSerializedRegiment(invalidRegiment, dok, keywords);
    expect(errorMsgs.length).toBe(1);

    // shadow queen cannot be a leader
    invalidRegiment.leader = unitOptions[0].id;
    errorMsgs = validateSerializedRegiment(invalidRegiment, dok, keywords);
    expect(errorMsgs.length).toBe(1);

    // shadow queen good under morathi
    const validRegiment = {
        leader: morathiUnit.id,
        units: [unitOptions[0].id]
    };
    errorMsgs = validateSerializedRegiment(validRegiment, dok, keywords);
    expect(errorMsgs.length).toBe(0);
});

test('Lord Kroak regiment options', () =>{
    // 0-1 Skink Starpriest or Favoured Spawning
    const aos = getAos();
    const army = aos.getArmy('Seraphon');
    expect(army).toBeTruthy();

    const leaderId = "df01-5aa1-a502-7a0c";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Lord Kroak")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
        "Saurus Astrolith Bearer",
        "Skink Starpriest",
        "Aggradon Lancers",
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
        "Saurus Guard",
        "Saurus Warriors",
        "Skinks",
        "Spawn of Chotec",
        "Stegadon",
        "Terradon Riders",
        "Terrawings",
    ]);
});

test('Skink Starpriest regiment options', () =>{
    // non-MONSTER Skink
    const aos = getAos();
    const army = aos.getArmy('Seraphon');
    expect(army).toBeTruthy();

    const keywords = aos._getAvailableKeywords(army);
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

    
    // two monsters should fail
    const invalidRegiment = {
        leader: leader.id,
        units: [
            unitOptions[0].id,
            unitOptions[2].id
        ]
    };

    let errorMsgs = validateSerializedRegiment(invalidRegiment, army, keywords);
    expect(errorMsgs.length).toBe(1);

    // one monster pass
    const validRegiment = {
        leader: leader.id,
        units: [
            unitOptions[0].id,
            unitOptions[10].id
        ]
    }
    errorMsgs = validateSerializedRegiment(validRegiment, army, keywords);
    expect(errorMsgs.length).toBe(0);
});

test('Terradon Chief regiment options', () =>{
    // Any Skink Cavalry
    const aos = getAos();
    const army = aos.getArmy('Seraphon');
    expect(army).toBeTruthy();

    const keywords = aos._getAvailableKeywords(army);
    const leaderId = "767f-699-a82d-ca70";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Terradon Chief")
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
        "Raptadon Chargers",
        "Raptadon Hunters",
        "Ripperdactyl Riders",
        "Spawn of Chotec",
        "Stegadon",
        "Terradon Riders", // 2x ?
        "Terrawings",
    ]);
});

test('Akhelian King regiment options', () =>{
    // ' or '
    const aos = getAos();
    const army = aos.getArmy('Idoneth Deepkin');
    expect(army).toBeTruthy();

    const keywords = aos._getAvailableKeywords(army);
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

    // picking both of or is bad (max 1)
    let badReg = {
        leader: leader.id,
        units: [
            unitOptions[0].id,
            unitOptions[1].id
        ]
    };
    let errorMsgs = validateSerializedRegiment(badReg, army, keywords);
    expect(errorMsgs.length).toBe(1);

    // two of one is bad
    badReg = {
        leader: leader.id,
        units: [
            unitOptions[0].id,
            unitOptions[0].id
        ]
    };
    errorMsgs = validateSerializedRegiment(badReg, army, keywords);
    expect(errorMsgs.length).toBe(1);

    const goodReg = {
        leader: leader.id,
        units: [
            unitOptions[0].id,
            unitOptions[3].id
        ]
    };
    errorMsgs = validateSerializedRegiment(goodReg, army, keywords);
    expect(errorMsgs.length).toBe(0);
});

test('Scinari Enlightener regiment options', () =>{
    // specific unit name allowed
    const aos = getAos();
    const army = aos.getArmy('Lumineth Realm-lords');
    expect(army).toBeTruthy();

    const keywords = aos._getAvailableKeywords(army);
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

    // two riverblads should fail
    const invalidRegiment = {
        leader: leader.id,
        units: [
            unitOptions[0].id,
            unitOptions[0].id
        ]
    };

    let errorMsgs = validateSerializedRegiment(invalidRegiment, army, keywords);
    expect(errorMsgs.length).toBe(1);

    // pass
    const validRegiment = {
        leader: leader.id,
        units: [
            unitOptions[0].id,
            unitOptions[1].id
        ]
    };
    errorMsgs = validateSerializedRegiment(validRegiment, army, keywords);
    expect(errorMsgs.length).toBe(0);
});

test('Vanari Lord Regent regiment options', () =>{
    // hero via faction catagory (lumineth paragon)
    // keyword that is also in unit names
    const aos = getAos();
    const army = aos.getArmy('Lumineth Realm-lords');
    expect(army).toBeTruthy();

    const leaderId = "2e0b-1a0a-3d2b-8fef";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Vanari Lord Regent")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
        "The Light of Eltharion",
        "Vanari Bannerblade",
        "Ydrilan Riverblades",
        "Vanari Bladelords",
        "Vanari Dawnriders",
        "Vanari Auralan Sentinels",
        "Vanari Auralan Wardens",
        "Vanari Starshard Ballista",
        "The Light of Eltharion (Scourge of Ghyran)",
        "Vanari Bannerblade (Scourge of Ghyran)",
      ]);
});

test('Cities of sigmar regiment options', () =>{
    // hero via faction catagory (lumineth paragon)
    // keyword that is also in unit names
    const aos = getAos();
    const army = aos.getArmy('Cities of Sigmar');
    expect(army).toBeTruthy();

    const leaderId = "708d-414f-a3f-3734";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Pontifex Zenestra, Matriarch of the Great Wheel")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
       "Freeguild Steelhelms",
       "Freeguild Command Corps",
       "Flagellants",
       "Freeguild Cavaliers",
       "Freeguild Fusiliers",
       "Toll's Companions",
       "Wildercorps Hunters",
       "Freeguild Cavaliers (Scourge of Ghyran)"
      ]);
});

test('Legion of the First Prince', () =>{
    // Eternus has a title, but can be referenced by Eternus
    const aos = getAos();
    const army = aos.getArmy('Slaves to Darkness - Legion of the First Prince');
    expect(army).toBeTruthy();

    const leaderId = "672f-33c8-1e61-cead";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Be'lakor, the Dark Master")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
        "Eternus, Blade of the First Prince",
        "Varanguard",
        "Chaos Legionnaires",
        "Chaos Furies",
        "Centaurion Marshal",
        "Legion of the First Prince Bloodcrushers",
        "Legion of the First Prince Beasts of Nurgle",
        "Legion of the First Prince Bloodletters",
        "Legion of the First Prince Flamers of Tzeentch",
        "Legion of the First Prince Fiends",
        "Legion of the First Prince Hellflayer",
        "Legion of the First Prince Plaguebearers",
        "Legion of the First Prince Screamers of Tzeentch",
    ]);
});


test('FEC Nagash', () =>{
    // Eternus has a title, but can be referenced by Eternus
    const aos = getAos();
    const army = aos.getArmy('Flesh-eater Courts');
    expect(army).toBeTruthy();

    const leaderId = "4898-ff01-e50e-4325";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Nagash, Supreme Lord of the Undead")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
       "Crypt Haunter Courtier",
       "Crypt Infernal Courtier",
       "Grand Justice Gormayne",
       "Marrowscroll Herald",
       "Royal Decapitator",
       "Varghulf Courtier",
       "Crypt Horrors",
       "Crypt Flayers",
       "Crypt Ghouls",
       "Cryptguard",
       "Morbheg Knights",
       "Royal Beastflayers",
       "Royal Terrorgheist",
       "Royal Zombie Dragon",
    ]);
});

test('Runefather on Magmadroth', () =>{
    // Eternus has a title, but can be referenced by Eternus
    const aos = getAos();
    const army = aos.getArmy('Fyreslayers');
    expect(army).toBeTruthy();

    const leaderId = "37e2-9685-abe9-bc10";
    const leader = army.units[leaderId];
    expect(leader).toBeTruthy();
    expect(leader.name).toEqual("Auric Runefather on Magmadroth")
    const unitOptions = aos.getRegimentOptions(army, leaderId);
    expect(unitOptions).toBeTruthy();
    const names = [];
    unitOptions.forEach(option => {
        names.push(option.name);
    });
    expect(names).toEqual([
        "Grimwrath Berzerker",
        "Auric Runefather on Magmadroth",
        "Auric Runeson",
        "Auric Runeson on Magmadroth",
        "Battlesmith",
        "Doomseeker",
        "Grimhold Exile",
        "Auric Hearthguard",
        "Hearthguard Berzerkers with Berzerker Broadaxes",
        "Hearthguard Berzerkers with Flamestrike Poleaxes",
        "Vulkite Berzerkers with Bladed Slingshields",
        "Vulkite Berzerkers with Fyresteel Weapons",
        "Vulkyn Flameseekers",
        "Auric Runeson on Magmadroth (Scourge of Ghyran)"
    ]);
});