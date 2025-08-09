
class Importer {
    canImport(text: string) {
        return false;
    }
    async import(text: string) {
        return {};
    }
}

const ImportRoster = {
    _importers: [] as Importer[],
    registerImporter(newImporter: Importer) {
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
    async import(text: string) {
        const t = this.stripMatchingDelimiters(text);
        let result = null;
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
