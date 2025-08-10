import { NameRoster, NameUnit } from "../../../shared-lib/NameRoster.js";
import RosterInterf from "../../../shared-lib/RosterInterface.js";

export class NameRosterImporter {
    canImport(text: string): boolean {
        return false;
    }
    async import(text: string): Promise<RosterInterf | null> {
        return null;
    }
    newNameRoster() {
        const nameRoster: NameRoster = {
            name: '',
            armyName: '',
            battleFormation: null,
            battleTacticCards: [],
            lores: {},
            factionTerrain: null,
            regimentOfRenown: null,
            regiments: [],
            auxUnits: []
        };
        return nameRoster;
    }
    newNameUnit() {
        const unit: NameUnit = {
            name: '',
            isGeneral: false,
            isReinforced: false,
            other: []
        };
        return unit;
    }
}

export const ImportRoster = {
    _importers: [] as NameRosterImporter[],
    registerImporter(newImporter: NameRosterImporter) {
        this._importers.push(newImporter);
    },
    stripMatchingDelimiters: (str: string) => {
        const match = str.match(/^(['"`])\1*([\s\S]*?)\1*$/);
        if (match && match[1] && str.startsWith(match[1]) && str.endsWith(match[1])) {
            return match[2];
        }
        return str;
    },
    canImport(text: string) {
        const t = this.stripMatchingDelimiters(text);
        for (let i = 0; i < this._importers.length; ++i) {
            const importer = this._importers[i];
            if (importer.canImport(t))
                return true;
        }
        return false;
    },
    async import(text: string): Promise<RosterInterf | null> {
        const t = this.stripMatchingDelimiters(text);
        let result: RosterInterf | null = null;
        for (let i = 0; i < this._importers.length; ++i ) {
            const importer = this._importers[i];
            if (importer.canImport(t)) {
                result = await importer.import(t);
                break;
            }
        };
        return result;
    }
}
