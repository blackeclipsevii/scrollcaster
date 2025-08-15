import { NameRoster } from "../../../shared-lib/NameRoster.js";
import ImportOfficialRoster from "./importOfficialRoster.js";

export default class ImportNewRecruitRoster extends ImportOfficialRoster {
    specialCookie() {
        return 'Created with New Recruit';
    }
    async createNameRoster(lines: string[]): Promise<NameRoster|Error> {
        const nameRoster = this.newNameRoster();

        let i = 0;
        let hasName = false;
        if (lines[i].includes('(')) {
            hasName = true;
            nameRoster.name = this.safeSplit(lines[i], '(', 0);
            ++i;
        }
        
        // move to the the next full line
        while (this.isEmptyOrHyphens(lines[i]))
            ++i

        nameRoster.armyName = lines[i];
        if (!hasName) {
            hasName = true;
            nameRoster.name = lines[i];
        }
        
        ++i;
        if (!lines[i].startsWith('Auxiliaries:')) {
            nameRoster.battleFormation = lines[i];
        }
        ++i;

        // to-do most of these are the same as the official roster
        for (; i < lines.length; ++i) {
            const line = lines[i].trim();
            if (line.includes('Battle Tactic')) {
                const cards = this.safeSplit(line, ' - ', 1);
                if (cards.includes(', '))
                    nameRoster.battleTacticCards = cards.split(', ');
            }
            else if (line.includes('Spell Lore')) {
                nameRoster.lores.spell = this.safeSplit(lines[i], ' - ', 1);
            }
            else if (line.includes('Prayer Lore')) {
                nameRoster.lores.prayer = this.safeSplit(lines[i], ' - ', 1);
            }
            else if (line.includes('Manifestation Lore')) {
                nameRoster.lores.manifestation = this.safeSplit(lines[i], ' - ', 1);
            }
            else if (line.includes(`General's Regiment`) || line.includes('Regiment ')) {
                i = this.parseRegiment(i, lines, nameRoster);
            }
            else if (line.includes('Auxiliary Units')) {
                i = this.parseRegiment(i, lines, nameRoster, true);
            }
            else if (line.includes ('Faction Terrain')) {
                ++ i;
                nameRoster.factionTerrain = this.safeSplit(lines[i], ' (', 0);
            }
        }
        return nameRoster;
    }
}