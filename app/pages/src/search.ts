import { dynamicPages } from "../../lib/host.js";
import { dynamicGoTo, setHeaderTitle, Settings } from "../../lib/widgets/header.js";
import { endpoint } from "../../lib/endpoint.js";

import { fetchWithLoadingDisplay } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";
import { SearchableObject } from "../../../shared-lib/SearchableObject.js";
import { WarscrollSettings } from "./warscroll.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { getVar } from "../../lib/functions/getVar.js";
import { fetchSearch } from "../../lib/RestAPI/search.js";
import { makeSelectableItemName, makeSelectableItemType } from "../../lib/widgets/helpers.js";

export class SearchSettings implements Settings{
    [name: string]: unknown;
};

const searchPage = {
    settings: null as SearchSettings | null,
    _cache: {
        query: null as string | null,
        results: null as SearchableObject[] | null
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
                interface Result {
                    item: SearchableObject
                }
                const result = await fetchWithLoadingDisplay(encodeURI(url)) as Result[] | null;
                if (result) {
                    return result.map(res => res.item) as SearchableObject[];
                }
                return null;
            } catch (error) {
                return null;
            }
        }
        const displaySearchResults = (results: SearchableObject[]) => {
            const section = document.getElementById('results-section') as HTMLElement;
            const itemList = document.querySelector('.item-list') as HTMLElement;
            section.style.display = '';
            itemList.innerHTML = '';

            // interface SearchableObject {
            //     name: string;
            //     id: string;
            //     type: number;
            //     armyName: string;
            //     keywords: string[];
            // };

            const makeSelectableItem = (displayableObj: SearchableObject, isUnit: boolean, parentList: HTMLElement, onclick: (this: HTMLDivElement, ev: MouseEvent) => any) => {
                const section = parentList.closest('.section') as HTMLElement | null;
                if (!section)
                    return;
                section.style.display = 'block';

                const item = document.createElement('div');
                item.classList.add('selectable-item');
                item.addEventListener('click', onclick);

                const left = document.createElement('div');
                left.classList.add('selectable-item-left');

                const nameEle = makeSelectableItemName(displayableObj);
                left.appendChild(nameEle);

                const roleEle = makeSelectableItemType(displayableObj, isUnit);
                left.appendChild(roleEle);

                const armyName = makeSelectableItemType(displayableObj.armyName);
                left.appendChild(armyName);

                const right = document.createElement('div');
                right.classList.add('selectable-item-right');

                item.append(left, right);
                parentList.appendChild(item);
                
                return item;
            };
        
            results.forEach(result => {
                makeSelectableItem(result, true, itemList, async () =>{
                    let armyName: string | null = result.armyName;
                    if (armyName.toLowerCase() === 'core')
                        armyName = null;

                    const unit = await getSpecificUnit(result.id, armyName);
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
                        const result = await fetchSearch(value);
                        thisPage._cache.query = value;
                        thisPage._cache.results = result;
                        displaySearchResults(result as SearchableObject[]);
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
