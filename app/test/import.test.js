
import { ImportRoster } from '../dist/lib/functions/import/importRoster.js';
import { registerAllImporters } from '../dist/lib/functions/import/registerAllImporters.js'
import RosterStateConverter from '../dist/lib/functions/import/RosterStateConvertImpl.js';

var register = true;
test('Import official (iOS)', async () =>{
    if (register)
        registerAllImporters();

    const list = `
My list 1550/2000 pts
-----
Grand Alliance Order | Lumineth Realm-lords | Scinari Council
General's Handbook 2025-26
Auxiliaries: 1
Drops: 4
Spell Lore - Lore of Hysh
Manifestation Lore - Manifestations of Hysh
Battle Tactics Cards: Intercept and Recover and Restless Energy
-----
General's Regiment
Ellania and Ellathor, Eclipsian Warsages (280)
• General
Vanari Dawnriders (460)
• Reinforced
---
Regiment 1
Scinari Cathallar (110)
• Silver Wand
• Flawless Commander
-----
Regiments of Renown
Saviours of Cinderfall (270)
Callis and Toll
Toll's Companions
-----
Auxiliary Units
Avalenor, The Stoneheart King (410)
-----
Faction Terrain
Shrine Luminor (20)
-----
Created with Warhammer Age of Sigmar: The App
App: v1.18.0 (1) | Data: v334
    `;

    // expect(ImportRoster.canImport(list)).toBeTruthy();
    const roster = await ImportRoster.import(list.trim());
    // console.log(JSON.stringify(roster, null, 2));
    expect(roster).toBeTruthy();
    expect(roster.name).toEqual('My list');
    expect(roster.regiments.length).toEqual(2);
    expect(roster.auxiliaryUnits.length).toEqual(1);
    expect(roster.lores.spell.name).toEqual('Lore of Hysh');
    expect(roster.lores.manifestation.name).toEqual('Manifestations of Hysh');
    expect(roster.regimentOfRenown.name).toEqual(`Saviours of Cinderfall`);
    expect(roster.terrainFeature.name).toEqual('Shrine Luminor');
    expect(roster.battleTacticCards.length).toEqual(2);

    // serialize / deserialize round trip
    const rsc = new RosterStateConverter();
    const idRoster = rsc.serialize(roster);
    const roster2 = await rsc.deserialize(idRoster, roster.id);
    expect(roster2).toEqual(roster);
});

test('Import official (android)', async () =>{
    if (register)
        registerAllImporters();

    const list = `
Reddit Seraphon 1950/2000 pts

Seraphon
Sunclaw Starhost
General's Handbook 2025-26
Drops: 3
Spell Lore - Lore of Celestial Manipulation
Manifestation Lore - Forbidden Power

General's Regiment
Slann Starmaster (280)
 • General
Bastiladon with Ark of Sotek (230)
Kroxigor (210)
 • 1x Moonstone Hammer

Regiment 1
Saurus Scar-Veteran on Aggradon (170)
Aggradon Lancers (440)
 • Reinforced

Regiment 2
Scourge of Ghyran Saurus Oldblood on Carnosaur (340)
Saurus Warriors (160)
Skinks (80)


Created with Warhammer Age of Sigmar: The App
App: 1.18.0 | Data: 334
    `;

    // expect(ImportRoster.canImport(list)).toBeTruthy();
    const roster = await ImportRoster.import(list.trim());
    // console.log(JSON.stringify(roster, null, 2));
    expect(roster).toBeTruthy();
    expect(roster.name).toEqual('Reddit Seraphon');
    expect(roster.regiments.length).toEqual(3);
    expect(roster.auxiliaryUnits.length).toEqual(0);
    expect(roster.lores.spell.name).toEqual('Lore of Celestial Manipulation');
    expect(roster.lores.manifestation.name).toEqual('Forbidden Power');
    expect(roster.regimentOfRenown).toEqual(null);
    expect(roster.terrainFeature).toEqual(null);
    expect(roster.battleTacticCards.length).toEqual(0);
    
    // serialize / deserialize round trip
    const rsc = new RosterStateConverter();
    const idRoster = rsc.serialize(roster);
    const roster2 = await rsc.deserialize(idRoster, roster.id);
    expect(roster2).toEqual(roster);
});

test('Import new recruit', async () =>{
    if (register)
        registerAllImporters();

    const list = `
experimental (1790 points) - ✦ General's Handbook 2025-26

Lumineth Realm-lords
Scinari Council
Auxiliaries: 0
Drops: 3

Battle Tactic Cards - Restless Energy, Intercept and Recover
Manifestation Lore - Manifestations of Hysh
Spell Lore - Lore of Hysh

General's Regiment
Ellania and Ellathor, Eclipsian Warsages (280)
• General
The Light of Eltharion (Scourge of Ghyran) (250)
Vanari Auralan Sentinels (150)
• 1x Champion
Hurakan Spirit of the Wind (250)
Vanari Dawnriders (460)
• Reinforced
• 1x Champion
• 1x Standard Bearer

Regiment 1
Scinari Cathallar (110)
• Silver Wand

Faction Terrain
Shrine Luminor

Created with New Recruit
Data Version: v20
    `;

    // expect(ImportRoster.canImport(list)).toBeTruthy();
    const roster = await ImportRoster.import(list.trim());
    // console.log(JSON.stringify(roster, null, 2));
    expect(roster).toBeTruthy();
    expect(roster.name).toEqual('experimental');
    expect(roster.regiments.length).toEqual(2);
    expect(roster.auxiliaryUnits.length).toEqual(0);
    expect(roster.regimentOfRenown).toEqual(null);
    expect(roster.lores.spell.name).toEqual('Lore of Hysh');
    expect(roster.lores.manifestation.name).toEqual('Manifestations of Hysh');
    expect(roster.lores.prayer).toEqual(null);
    expect(roster.terrainFeature.name).toEqual('Shrine Luminor');
    expect(roster.battleTacticCards.length).toEqual(2);

    // serialize / deserialize round trip
    const rsc = new RosterStateConverter();
    const idRoster = rsc.serialize(roster);
    const roster2 = await rsc.deserialize(idRoster, roster.id);
    expect(roster2).toEqual(roster);
});


test('Import Scrollcaster', async () =>{
    if (register)
        registerAllImporters();

    const list = `
Big Waaagh! (1250 points) - GHB 2025-26

Ironjawz - Big Waaagh!
Auxiliaries: 0
Drops: 2

Battle Tactic Cards: 
  • Attuned to Ghyran
  • Master the Paths

Spell Lore: 
  • Spell Lore: Big Waaagh!

Prayer Lore: 
  • Prayer Lore: Big Waaagh!

General's Regiment: 
  Kragnos, the End of Empires (580)
    • General
  Marshcrawla Sloggoth (130)

Regiment 1: 
  Megaboss on Maw-krusha (340)
  Brutes (200)


Created with Scrollcaster
Client: 0.10.3beta | BSData: 48e97d5
    `;

    // expect(ImportRoster.canImport(list)).toBeTruthy();
    const roster = await ImportRoster.import(list.trim());
    // console.log(JSON.stringify(roster, null, 2));
    expect(roster).toBeTruthy();
    expect(roster.name).toEqual('Big Waaagh!');
    expect(roster.regiments.length).toEqual(2);
    expect(roster.auxiliaryUnits.length).toEqual(0);
    expect(roster.regimentOfRenown).toEqual(null);
    expect(roster.terrainFeature).toEqual(null);
    expect(roster.lores.spell.name).toEqual('Spell Lore: Big Waaagh!');
    expect(roster.lores.prayer.name).toEqual('Prayer Lore: Big Waaagh!');
    expect(roster.battleTacticCards.length).toEqual(2);
    
    // serialize / deserialize round trip
    const rsc = new RosterStateConverter();
    const idRoster = rsc.serialize(roster);
    const roster2 = await rsc.deserialize(idRoster, roster.id);
    expect(roster2).toEqual(roster);
});

