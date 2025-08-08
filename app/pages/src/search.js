class SearchSettings {
};

const searchPage = {
    settings: null,
    _cache: {
        query: null,
        results: null
    },
    async loadPage(settings) {
        this.settings = settings;
        const thisPage = this;
        async function getSpecificUnit(id, useArmy) {
            let url = `${endpoint}/units?id=${id}`;
            if (useArmy) {
                url = `${url}&army=${useArmy}`;
            }

            try {
                const result = await fetchWithLoadingDisplay(encodeURI(url));
                return result;
            } catch (error) {
                return null;
            }
        }
        const displaySearchResults = (results) => {
            const section = document.getElementById('results-section');
            const itemList = document.querySelector('.item-list');
            section.style.display = '';
            itemList.innerHTML = '';

            // interface SearchableObject {
            //     name: string;
            //     id: string;
            //     type: number;
            //     armyName: string;
            //     keywords: string[];
            // };

            const makeSelectableItem = (displayableObj, isUnit, parentList, onclick) => {
                const section = parentList.closest('.section');
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
                makeSelectableItem(result.item, true, itemList, async () =>{
                    let armyName = result.item.armyName;
                    if (armyName.toLowerCase() === 'core')
                        armyName = null;

                    const unit = await getSpecificUnit(result.item.id, armyName);
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
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

            const section = document.getElementById('results-section');
            section.style.display = '';

            const itemList = section.querySelector('.item-list');
            itemList.style.display = '';
            const emptySearchDisplay = `
                <p style='color: ${getVar('white-3')};'>
                    <i>Search is currently limited to units.</i>
                </p>
            `;

            const input = div.querySelector('.search-bar-input');
            input.placeholder = 'Start typing...';
            const content = document.getElementById('loading-content');
            content.insertBefore(div, content.firstChild);

            const minSearchLength = 3;
            let debounceTimer;
            input.addEventListener('input', () => {
                clearTimeout(debounceTimer); // Reset timer on each keystroke
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
                        displaySearchResults(result);
                    } 
                    else {
                        itemList.innerHTML = `
                            <p style='color: ${getVar('white-3')};'>
                                <i>Search is currently limited to units... and 3 or more letters</i>
                            </p>
                        `;
                    }
                    // You can trigger a search or update UI here
                }, 1000); // 1000 ms = 1 second
            });

            if (thisPage._cache.results) {
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
