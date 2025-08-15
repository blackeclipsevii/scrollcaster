import { NameRoster } from "../../../shared-lib/NameRoster.js";
import { ImportRoster } from "./importRoster.js";
import ImportOfficialRoster from "./importOfficialRoster.js";

export default class ImportScrollcasterRoster extends ImportOfficialRoster {
    specialCookie() {
        return 'Created with Scrollcaster';
    }
    async createNameRoster(lines: string[]): Promise<NameRoster|Error>{
        const nameRoster = this.newNameRoster();
        let hasName = false;
        let i = 0;
        if (lines[0].includes('(')) {
            hasName = true;
            nameRoster.name = this.safeSplit(lines[0], '(', 0);
            i = 1;
        }

        // move to the the next full line
        while (this.isEmptyOrHyphens(lines[i]))
            ++i

        if (!hasName) {
            nameRoster.name = lines[i];
        }
        nameRoster.armyName = lines[i];
        if (!lines[i].startsWith('Auxiliaries')) {
            nameRoster.battleFormation = lines[3];
        }

        const starElementReg = /\•\s+([^\(]+)/;
        const getStarElement = (line: string) => {
            let ele = line.match(starElementReg);
            if (ele)
                return ele[1].trim();
            return null;
        }

        for (let i = 6; i < lines.length; ++i) {
            let line = lines[i].trim();
            if (line.includes('Battle Tactic')) {
                ++ i;
                if (lines[i].includes('•')) { // tactic 1
                    nameRoster.battleTacticCards.push(this.safeSplit(lines[i], '•', 1));
                    ++i;
                    if (lines[i].includes('•')) {
                        nameRoster.battleTacticCards.push(this.safeSplit(lines[i], '•', 1));
                    }
                }
            }
            else if (line.includes('Spell Lore')) {
                ++ i;
                nameRoster.lores.spell = getStarElement(lines[i]);
            }
            else if (line.includes('Prayer Lore')) {
                ++ i;
                nameRoster.lores.prayer = getStarElement(lines[i]);
            }
            else if (line.includes('Manifestation Lore')) {
                ++ i;
                nameRoster.lores.manifestation = getStarElement(lines[i]);
            }
            else if (line.includes('Regiment of Renown')) {
                ++ i;
                nameRoster.regimentOfRenown = this.safeSplit(lines[i], ' (', 0);
            }
            else if (line.includes(`General's Regiment`) || line.includes('Regiment ')) {
                i = this.parseRegiment(i, lines, nameRoster);
            }
            else if (line.includes('Auxiliary Units')) {
                i = this.parseRegiment(i, lines, nameRoster, true);
            }
            else if (line.includes ('Faction Terrain')) {
                ++ i;
                nameRoster.factionTerrain = getStarElement(lines[i]);
            }
        }
        return nameRoster;
    }
}
