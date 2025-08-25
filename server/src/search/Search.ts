import Fuse from 'fuse.js'
import AgeOfSigmar from '../AgeOfSigmar.js';
import Unit from '../Unit.js';

import { SearchableObject } from '@scrollcaster/shared-lib/SearchableObject.js';

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
                    superType: unit.superType,
                    type: unit.type,
                    armyName: armyName,
                    keywords: unit.keywords,
                    _tags: unit._tags
                });
            });
        }

        alliances.forEach(alliance => {
            if (alliance.name.includes(' - '))
                return; // the aor should have the same scrolls?

           // console.log(`Populating ${alliance.name}...`);
            const army = ageOfSigmar.getArmy(alliance.name);
            if (!army)
                return;

            addUnits(army.units, army.name);
        });

        // universal manifestations
        addUnits(ageOfSigmar.units, 'Core');

        const rors = Object.values(ageOfSigmar.regimentsOfRenown);
        rors.forEach(ror => {
            const keywordSet: {[keyword: string]: boolean} = {'Regiment of Renown': true};
            const tagsSet: {[tag: string]: boolean} = {};
            ror.unitContainers.forEach(container => {
                container.unit.keywords.forEach(keyword => keywordSet[keyword] = true);
                container.unit._tags.forEach(tag => tagsSet[tag] = true);
            })

            this.dataset.push({
                name: ror.name,
                id: ror.id,
                superType: ror.superType,
                type: ror.type,
                armyName: 'Core',
                keywords: Object.getOwnPropertyNames(keywordSet),
                _tags: Object.getOwnPropertyNames(tagsSet),
            });
        });

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
                "keywords",
                "_tags"
            ]
        };
        this.fuse = new Fuse(this.dataset, fuseOptions);
    }
    search(searchPattern: string) {
        return this.fuse.search(searchPattern);
    }
}