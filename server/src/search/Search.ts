import Fuse from 'fuse.js'
import AgeOfSigmar from '../AgeOfSigmar.js';
import Unit from '../Unit.js';

interface SearchableObject {
    name: string;
    id: string;
    type: number;
    armyName: string;
    keywords: string[];
};

export default class Search {
    fuse: Fuse<SearchableObject>;
    dataset: SearchableObject[];
    constructor(ageOfSigmar: AgeOfSigmar) {
        const alliances = ageOfSigmar.getArmyAlliances();
        this.dataset = [];

        const addUnits = (unitLUT: {[name:string]: Unit}, armyName: string) => {
            const units = Object.values(unitLUT);
            units.forEach(unit => {
                this.dataset.push({
                    name: unit.name,
                    id: unit.id,
                    type: unit.type,
                    armyName: armyName,
                    keywords: unit.keywords.concat(unit._tags)
                });
            });
        }

        alliances.forEach(alliance => {
            if (alliance.name.includes(' - '))
                return; // the aor should have the same scrolls?

            console.log(`Populating ${alliance.name}...`);
            const army = ageOfSigmar.getArmy(alliance.name);
            if (!army)
                return;

            addUnits(army.units, army.name);
        });

        // universal manifestations
        addUnits(ageOfSigmar.units, 'Core');

        const fuseOptions = {
            // isCaseSensitive: false,
            // includeScore: false,
            // ignoreDiacritics: false,
            // shouldSort: true,
            // includeMatches: false,
            // findAllMatches: false,
            // location: 0,
            // distance: 100,
            // useExtendedSearch: false,
            // ignoreLocation: false,
            // ignoreFieldNorm: false,
            // fieldNormWeight: 1,
            minMatchCharLength: 2,
            threshold: 0.3,
            keys: [
                "name",
                "armyName",
                "keywords"
            ]
        };
        this.fuse = new Fuse(this.dataset, fuseOptions);
    }
    search(searchPattern: string) {
        return this.fuse.search(searchPattern);
    }
}