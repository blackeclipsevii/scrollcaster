
class ImportNewRecruitRoster extends ImportOfficialRoster {
    specialCookie() {
        return 'Created with New Recruit';
    }
    async createNameRoster(lines){
        const nameRoster = new NameRoster();
        if (!lines[0].includes('(')) {
            console.log('Import roster failed: Error parsing list');
            return null;
        }

        nameRoster.name = lines[0].split('(')[0].trim();
        
        // move to the the next full line
        let i = 1;
        while (this.isEmptyOrHyphens(lines[i]))
            ++i

        nameRoster.armyName = lines[i];
        ++i;
        if (!lines[i].startsWith('Auxiliaries:')) {
            nameRoster.battleFormation = lines[i];
        }
        ++i;

        // to-do most of these are the same as the official roster
        for (; i < lines.length; ++i) {
            const line = lines[i].trim();
            if (line.includes('Battle Tactic Cards')) {
                let cards = line.split(' - ')[1];
                nameRoster.battleTacticCards = cards.split(', ');
            }
            else if (line.includes('Spell Lore')) {
                nameRoster.lores.spell = lines[i].split(' - ')[1].trim();
            }
            else if (line.includes('Prayer Lore')) {
                nameRoster.lores.prayer = lines[i].split(' - ')[1].trim();
            }
            else if (line.includes('Manifestation Lore')) {
                nameRoster.lores.manifestation = lines[i].split(' - ')[1].trim();
            }
            else if (line.includes(`General's Regiment`) || line.includes('Regiment ')) {
                i = this.parseRegiment(i, lines, nameRoster);
            }
            else if (line.includes('Auxiliary Units')) {
                i = this.parseRegiment(i, lines, nameRoster, true);
            }
            else if (line.includes ('Faction Terrain')) {
                ++ i;
                nameRoster.factionTerrain = lines[i].split(' (')[0].trim();
            }
        }
        return nameRoster;
    }
}

ImportRoster.registerImporter(new ImportNewRecruitRoster);