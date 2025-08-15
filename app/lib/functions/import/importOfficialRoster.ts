import { NameRoster } from "../../../shared-lib/NameRoster.js";
import RosterInterf from "../../../shared-lib/RosterInterface.js";
import { NameRosterImporter } from "./importRoster.js";
import { nameRosterToRoster } from "./nameRosterToRoster.js";

export default class ImportOfficialRoster extends NameRosterImporter {
    specialCookie() {
        return 'Created with Warhammer Age of Sigmar: The App';
    }
    isEmptyOrHyphens = (str: string) => {
        return /^-*$/.test(str.trim());
    }
    canImport(listStr: string) {
        const lines = listStr.split('\n');
        for (let i = lines.length-1; i >= 0; --i) {
            if (lines[i].includes(this.specialCookie())) {
                return true;
            }
        }
        return false;
    }
    safeSplit = (str: string, delim: string, expectedIndex: number): string => {
        const split = str.split(delim);
        if (split.length <= expectedIndex)
            return '';
        return split[expectedIndex].trim();
    }
    parseRegiment(i: number, lines: string[], nameRoster: NameRoster, asAux=false) {
        ++ i;
        let regiment = [];

        while (i < lines.length && !this.isEmptyOrHyphens(lines[i]) && lines[i].includes(' (')) {
            let unit = this.newNameUnit();
            let line = lines[i].trim();
            
            // convert sog to bsdata formatting
            let addSoG = false;
            const sog = 'Scourge of Ghyran';
            if (line.includes(sog)) {
                addSoG = true;
                line = line.replace(/\(?Scourge of Ghyran\)?/g, "").trim();
            }
            else if (line.startsWith('SOG ')) {
                addSoG = true;
                line = line.substring(4).trim();
            }
            
            const parts = line.split(' (');
            unit.name = parts[0].trim();
            if (addSoG) {
                // BSData formatting
                unit.name = `${unit.name} (${sog})`;
            }

            ++ i;
            while (lines.length > i && lines[i].length > 0 && lines[i].includes('•')) {
                line = lines[i].trim();
                let upgrade = line.split('•')[1].trim();
                if (upgrade.toLowerCase() === 'reinforced') {
                    unit.isReinforced = true;
                } else if (upgrade.toLowerCase() === 'general') {
                    unit.isGeneral = true;
                } else {
                    unit.other.push(upgrade);
                }
                ++i;
            }
            regiment.push(unit);
        }
        if (asAux) {
            nameRoster.auxUnits = regiment
        } else {
            nameRoster.regiments.push(regiment);
        }
        return i;
    }
    async createNameRoster(lines: string[]): Promise<NameRoster|Error> {
        const nameRoster = this.newNameRoster();
        let foundName = false;
        let i = 0;
        if (/\d/.test(lines[i])) {
            foundName = true;
            nameRoster.name = lines[0].split(' ').slice(0, -2).join(' ');
            ++ i;
        }
        while (this.isEmptyOrHyphens(lines[i]))
            ++i

        if (lines[i].includes('|')) { // iOS
            const factionParts = lines[i].split('|');
            nameRoster.armyName = factionParts[1].trim();
            // official forces the battle formation pick
            nameRoster.battleFormation = factionParts[2].trim();
        } else {
            nameRoster.armyName = lines[i].trim();
            ++ i;
            nameRoster.battleFormation = lines[i].trim();
            ++ i;
        }

        if (!foundName) {
            nameRoster.name = nameRoster.armyName;
            foundName = true;
        }

        for (;i < lines.length; ++i) {
            let line = lines[i].trim();
            if (line.includes('Battle Tactic')) {
                let cards: string | string[] = this.safeSplit(line, ':', 1);
                cards = cards.replace('cept and ', 'cept & ');
                cards = cards.split(' and ');
                for (let c = 0; c < cards.length; ++c) {
                    if (cards[c].includes('&'))
                        cards[c] = cards[c].replace('&', 'and');
                }
                nameRoster.battleTacticCards = cards;
            }
            else if (line.includes('Spell Lore')) {
                nameRoster.lores.spell = this.safeSplit(line, ' - ', 1);
            }
            else if (line.includes('Prayer Lore')) {
                nameRoster.lores.prayer = this.safeSplit(line, ' - ', 1);
            }
            else if (line.includes('Manifestation Lore')) {
                nameRoster.lores.manifestation = this.safeSplit(line, ' - ', 1);
            }
            else if (line.includes('Regiments of Renown')) {
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
                nameRoster.factionTerrain = this.safeSplit(lines[i], ' (', 0);
            }
        }

        return nameRoster;
    }
    async import(listStr: string): Promise<RosterInterf|Error> {
        const lines = listStr.split('\n');
        const nameRoster = await this.createNameRoster(lines);
        if ((nameRoster as Error).message) {
            return nameRoster as Error;
        }

        return await nameRosterToRoster(nameRoster as NameRoster);
    }
}