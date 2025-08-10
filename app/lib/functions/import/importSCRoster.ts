import { NameRoster } from "../../../shared-lib/NameRoster.js";
import { ImportRoster } from "./importRoster.js";
import ImportOfficialRoster from "./importOfficialRoster.js";

export default class ImportScrollcasterRoster extends ImportOfficialRoster {
    specialCookie() {
        return 'Created with Scrollcaster';
    }
    async createNameRoster(lines: string[]): Promise<NameRoster|null>{
        const nameRoster = this.newNameRoster();
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
            if (line.includes('Battle Tactic Cards')) {
                ++ i;
                if (lines[i].includes('•')) { // tactic 1
                    nameRoster.battleTacticCards.push(lines[i].split('•')[1].trim());
                    ++i;
                    if (lines[i].includes('•')) {
                        nameRoster.battleTacticCards.push(lines[i].split('•')[1].trim());
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
                nameRoster.regimentOfRenown = lines[i].split(' (')[0].trim();
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

ImportRoster.registerImporter(new ImportScrollcasterRoster);
