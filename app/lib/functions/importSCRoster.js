
const importRoster = async (listStr) => {
    const lines = listStr.split('\n');
    let isScrollcasterList = false;
    for (let i = lines.length-1; i >= 0; --i) {
        if (lines[i].includes('Created with Scrollcaster')) {
            isScrollcasterList = true;
            break;
        }
    }

    if (!isScrollcasterList) {
        console.log('Import roster failed: list was not created by scrollcaster')
        return null;
    }

    const nameRoster = new NameRoster();
    if (!lines[0].includes('(')) {
        console.log('Import roster failed: Error parsing list');
        return null;
    }

    nameRoster.name = lines[0].split('(')[0].trim();
    nameRoster.armyName = lines[2];
    if (!lines[3].startsWith('Auxiliaries')) {
        nameRoster.battleFormation = lines[3];
    }

    const parseRegiment = (i, asAux=false) => {
        ++ i;
        let line = lines[i].trim();
        let regiment = [];

        while (line.length > 0 && line.includes(' (')) {
            let unit = new NameUnit;

            // scourge?
            const parts = line.split(' (');
            unit.name = line.split(' (')[parts.length-2].trim();
            ++ i;

            line = lines[i].trim();
            while (line.length > 0 && line.includes('*')) {
                let upgrade = line.split('*')[1].trim();
                if (upgrade === 'REINFORCED') {
                    unit.isReinforced = true;
                } else if (upgrade === 'GENERAL') {
                    unit.isGeneral = true;
                } else if (upgrade.startsWith('Artefact')) {
                    unit.artefact = upgrade.split(':')[1].trim();
                } else if (upgrade.startsWith('Heroic Trait')) {
                    unit.heroicTrait = upgrade.split(':')[1].trim();
                } else if (upgrade.startsWith('Monstrous Trait')) {
                    unit.monstrousTrait = upgrade.split(':')[1].trim();
                } else {
                    unit.other.push(upgrade);
                }
                ++i;
                line = lines[i].trim();
            }
            regiment.push(unit);
            line = lines[i];
        }
        if (asAux) {
            nameRoster.auxUnits = regiment
        } else {
            nameRoster.regiments.push(regiment);
        }
        return i;
    }

    for (let i = 6; i < lines.length; ++i) {
        const line = lines[i].trim();
        if (line.includes('Battle Tactic Cards')) {
            ++ i;
            if (lines[i].includes('*')) { // tactic 1
                nameRoster.battleTacticCards.push(lines[i].split('*')[1].trim());
                ++i;
                if (lines[i].includes('*')) {
                    nameRoster.battleTacticCards.push(lines[i].split('*')[1].trim());
                }
            }
        }
        else if (line.includes('Spell Lore')) {
            ++ i;
            nameRoster.lores.spell = lines[i].split('*')[1].trim();
        }
        else if (line.includes('Prayer Lore')) {
            ++ i;
            nameRoster.lores.prayer = lines[i].split('*')[1].trim();
        }
        else if (line.includes('Manifestation Lore')) {
            ++ i;
            nameRoster.lores.manifestation = lines[i].split('*')[1].trim();
        }
        else if (line.includes(`General's Regiment`) || line.includes('Regiment ')) {
            i = parseRegiment(i);
        }
        else if (line.includes('Auxiliary Units')) {
            i = parseRegiment(i, true);
        }
        else if (line.includes ('Faction Terrain')) {
            ++ i;
            nameRoster.factionTerrain = lines[i].split('*')[1].trim();
        }
    }
    
    const roster = await nameRosterToRoster(nameRoster);
    return roster;
}