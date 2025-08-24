import { NameRoster } from "@scrollcaster/shared-lib/NameRoster";
import RosterInterf from "@scrollcaster/shared-lib/RosterInterface";
import { NameRosterImporter } from "./importRoster";
import { nameRosterToRoster } from "./nameRosterToRoster";

const removeLeadingNumberX = (str: string) => {
    return str.replace(/^\d+x/, '');
}

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
    isBulletedItem = (line: string) => {
        if (this.isEmptyOrHyphens(line))
            return false;
        
        const trimmedLine = line.trim();
        const bullets = ['•', '-', '*'];
        for (let i = 0; i < bullets.length; ++i) {
            if (trimmedLine.startsWith(bullets[i]))
                return true;
        }
        return false;
    }
    parseRegiment(i: number, lines: string[], nameRoster: NameRoster, asAux=false) {
        ++ i;
        let regiment = [];

        while (i < lines.length && !this.isEmptyOrHyphens(lines[i]) && lines[i].includes(' (')) {
            let unit = this.newNameUnit();
            let line = removeLeadingNumberX(lines[i].trim());
            
            // convert sog to bsdata formatting
            let addSoG = false;
            const sog = 'Scourge of Ghyran';
            if (line.includes(sog)) {
                addSoG = true;
                line = line.replace(/\(?Scourge of Ghyran\)?/g, "").trim();
            }
            else if (line.toUpperCase().startsWith('SOG ')) {
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
            while (lines.length > i && lines[i].length > 0 && this.isBulletedItem(lines[i])) {
                line = lines[i].trim();
                let upgrade = line.substring(1).trim(); // remove the bullet
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
    parseBattleTacticCards(line: string) {
        let cardsStr = line;
        if (line.includes(':')) {
            cardsStr = this.safeSplit(line, ':', 1);
        } else if (line.includes('-')) {
            cardsStr = this.safeSplit(line, '-', 1);
        }

        if (cardsStr.includes(',')) {
            return cardsStr.split(', ');
        }
        else if (cardsStr.includes('/')) {
            return cardsStr.split('/');
        }

        // the delimiter might be an and
        cardsStr = cardsStr.replace('cept and ', 'cept & ');
        let cards = cardsStr.split(' and ');

        for (let c = 0; c < cards.length; ++c) {
            if (cards[c].includes('&'))
                cards[c] = cards[c].replace('&', 'and');
        }

        return cards;
    }
    async createNameRoster(lines: string[]): Promise<NameRoster|Error> {
        const nameRoster = this.newNameRoster();
        let foundName = false;
        let i = 0;
        if (lines[i].includes('(')) {
            foundName = true;
            nameRoster.name = this.safeSplit(lines[i], '(', 0);
            ++i;
        }
        else if (/\d/.test(lines[i])) {
            foundName = true;
            nameRoster.name = lines[0].split(' ').slice(0, -2).join(' ');
            ++ i;
        }

        while (this.isEmptyOrHyphens(lines[i]))
            ++i

        if (lines[i].includes('|')) { // iOS
            const factionParts = lines[i].split('|');
            let offset = 0;
            if (factionParts.length === 3)
                offset = 1;
            nameRoster.armyName = factionParts[offset].trim();
            nameRoster.battleFormation = factionParts[offset + 1].trim();
        } else {
            nameRoster.armyName = lines[i].trim();
            
            ++i;
            if (!lines[i].startsWith('Auxiliaries:')) {
                nameRoster.battleFormation = lines[i];
            }
        }

        ++i;
    
        if (!foundName) {
            nameRoster.name = nameRoster.armyName;
            foundName = true;
        }

        const parseLore = (str: string) => {
            let result = this.safeSplit(str, ' - ', 1);
            if (result.includes(' (')) {
                result = this.safeSplit(result, ' (', 0);
            }
            return result;
        }

        for (;i < lines.length; ++i) {
            let line = lines[i].trim();
            if (line.includes('Battle Tactic')) {
                nameRoster.battleTacticCards = this.parseBattleTacticCards(line);
            }
            else if (line.includes('Spell Lore')) {
                nameRoster.lores.spell = parseLore(line);
            }
            else if (line.includes('Prayer Lore')) {
                nameRoster.lores.prayer = parseLore(line);
            }
            else if (line.includes('Manifestation Lore')) {
                nameRoster.lores.manifestation = parseLore(line);
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