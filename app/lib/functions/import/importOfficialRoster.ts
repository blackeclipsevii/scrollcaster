class ImportOfficialRoster extends NameRosterImporter {
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
    parseRegiment(i: number, lines: string[], nameRoster: NameRoster, asAux=false) {
        ++ i;
        let line = lines[i].trim();
        let regiment = [];

        while (!this.isEmptyOrHyphens(line) && line.includes(' (')) {
            let unit = this.newNameUnit();

            // convert sog to bsdata formatting
            let addSoG = false;
            const sog = 'Scourge of Ghyran';
            if (line.includes(sog)) {
                addSoG = true;
                line = line.replace(/\(?Scourge of Ghyran\)?/g, "").trim();
            }
            
            const parts = line.split(' (');
            unit.name = parts[0].trim();
            if (addSoG) {
                // BSData formatting
                unit.name = `${unit.name} (${sog})`;
            }
            ++ i;

            line = lines[i].trim();
            while (line.length > 0 && line.includes('•')) {
                let upgrade = line.split('•')[1].trim();
                if (upgrade.toLowerCase() === 'reinforced') {
                    unit.isReinforced = true;
                } else if (upgrade.toLowerCase() === 'general') {
                    unit.isGeneral = true;
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
    async createNameRoster(lines: string[]): Promise<NameRoster|null> {
        const nameRoster = this.newNameRoster();

        nameRoster.name = lines[0].split(' ').slice(0, -2).join(' ');

        // move to the the next full line
        let i = 1;
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

        for (;i < lines.length; ++i) {
            let line = lines[i].trim();
            if (line.includes('Battle Tactic Cards')) {
                let cards: string | string[] = line.split(':')[1];
                cards = cards.replace('cept and ', 'cept & ');
                cards = cards.split(' and ');
                for (let c = 0; c < cards.length; ++c) {
                    if (cards[c].includes('&'))
                        cards[c] = cards[c].replace('&', 'and');
                }
                nameRoster.battleTacticCards = cards;
            }
            else if (line.includes('Spell Lore')) {
                nameRoster.lores.spell = line.split(' - ')[1].trim();
            }
            else if (line.includes('Prayer Lore')) {
                nameRoster.lores.prayer = line.split(' - ')[1].trim();
            }
            else if (line.includes('Manifestation Lore')) {
                nameRoster.lores.manifestation = line.split(' - ')[1].trim();
            }
            else if (line.includes('Regiments of Renown')) {
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
                nameRoster.factionTerrain = lines[i].split(' (')[0].trim();
            }
        }

        return nameRoster;
    }
    async import(listStr: string) {
        const lines = listStr.split('\n');
        if (!this.canImport(listStr)) {
            console.log('Import roster failed canImport')
            return null;
        }

        const nameRoster = await this.createNameRoster(lines);
        if (!nameRoster) {
            return null;
        }

        const roster = await nameRosterToRoster(nameRoster);
        return roster;
    }
}

ImportRoster.registerImporter(new ImportOfficialRoster);