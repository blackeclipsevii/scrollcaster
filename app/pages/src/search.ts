import { dynamicPages } from "../../lib/host.js";
import { dynamicGoTo, setHeaderTitle, Settings } from "../../lib/widgets/header.js";
import { endpoint } from "../../lib/endpoint.js";

import { fetchWithLoadingDisplay } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";
import { SearchableObject } from "../../shared-lib/SearchableObject.js";
import { WarscrollSettings } from "./warscroll.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { getVar } from "../../lib/functions/getVar.js";
import { fetchSearch } from "../../lib/RestAPI/search.js";
import { makeSelectableItemName, makeSelectableItemType } from "../../lib/widgets/helpers.js";
import UnitInterf from "../../shared-lib/UnitInterface.js";
import { Typed } from "../../shared-lib/BasicObject.js";

export class SearchSettings implements Settings{
    [name: string]: unknown;
};

interface Result {
    item: SearchableObject
}

const searchPage = {
    settings: null as SearchSettings | null,
    _cache: {
        query: null as string | null,
        results: null as Result[] | null
    },
    async loadPage(settings: Settings) {
        this.settings = settings as SearchSettings;
        const thisPage = this;
        async function getSpecificUnit(id: string, useArmy: string | null) {
            let url = `${endpoint}/units?id=${id}`;
            if (useArmy) {
                url = `${url}&army=${useArmy}`;
            }

            try {
                const result = await fetchWithLoadingDisplay(encodeURI(url)) as UnitInterf | null;
                return result;
            } catch (error) {
                return null;
            }
        }
        
        const makeSelectableItem = (searchResult: SearchableObject, isUnit: boolean, parentList: HTMLElement, onclick: ()=>void) => {
            const section = parentList.closest('.section') as HTMLElement;
            section.style.display = 'block';

            const item = document.createElement('div');
            item.classList.add('selectable-item');
            item.addEventListener('click', onclick);

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');

            const nameEle = makeSelectableItemName(searchResult);
            left.appendChild(nameEle);

            const roleEle = makeSelectableItemType({
                type: searchResult.type,
                superType: 'Unit'
            });
            left.appendChild(roleEle);

            const armyName = makeSelectableItemType(searchResult.armyName);
            left.appendChild(armyName);

            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            item.append(left, right);
            parentList.appendChild(item);
            
            return item;
        };

        const displaySearchResults = (results: Result[]) => {
            const section = document.getElementById('results-section') as HTMLElement;
            const itemList = document.querySelector('.item-list') as HTMLElement;
            section.style.display = '';
            itemList.innerHTML = '';

            results.forEach(result => {
                makeSelectableItem(result.item, true, itemList, async () =>{
                    let armyName: string | null = result.item.armyName;
                    if (armyName.toLowerCase() === 'core')
                        armyName = null;

                    const unit = await getSpecificUnit(result.item.id, armyName);
                    const settings = new WarscrollSettings;
                    (settings as unknown as Settings).unit = unit;
                    dynamicGoTo(settings as unknown as Settings);
                });
            });
        }

        const _initialize = async () => {
            const sections = [
                'Results'
            ];
            makeLayout(sections);

            const div = document.createElement('div');
            div.id = 'search-bar-wrapper';
            div.innerHTML = `
                <div class='search-bar'>
                    <img class='search-bar-icon invert-img' src='../../resources/${getVar('search-icon')}'></img>
                    <input class='search-bar-input' type='search'></input>
                </div>
            `;

            const section = document.getElementById('results-section') as HTMLElement;
            section.style.display = '';

            const itemList = section.querySelector('.item-list') as HTMLElement;
            itemList.style.display = '';
            const emptySearchDisplay = `
                <p style='color: ${getVar('white-3')};'>
                    <i>Search is currently limited to units.</i>
                </p>
            `;

            const input = div.querySelector('.search-bar-input') as HTMLInputElement;
            input.placeholder = 'Start typing...';
            const content = document.getElementById('loading-content') as HTMLElement;
            content.insertBefore(div, content.firstChild);

            const minSearchLength = 3;
            let debounceTimer: unknown;
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer as number); // Reset timer on each keystroke
                debounceTimer = setTimeout(async () => {
                    const value = input.value.trim();
                    
                    if (value.length === 0) {
                        itemList.innerHTML = emptySearchDisplay;
                        thisPage._cache.query = '';
                        thisPage._cache.results = null;
                    }
                    else if (value.length >= minSearchLength) {
                        const result = await fetchSearch(value) as Result[] | null;
                        if (result) {
                            thisPage._cache.query = value;
                            thisPage._cache.results = result;
                            displaySearchResults(result);
                        }
                    } 
                    else {
                        itemList.innerHTML = `
                            <p style='color: ${getVar('white-3')};'>
                                <i>Search is currently limited to units... and 3 or more letters</i>
                            </p>
                        `;
                    }
                    // You can trigger a search or update UI here
                }, 1000) as unknown; // 1000 ms = 1 second
            });

            if (thisPage._cache.results && thisPage._cache.query) {
                input.value = thisPage._cache.query;
                displaySearchResults(thisPage._cache.results);
            } else {
                itemList.innerHTML = emptySearchDisplay
            }

            swapLayout();
            setHeaderTitle('Search');
        }

        _initialize();
    }
}

dynamicPages['search'] = searchPage;
