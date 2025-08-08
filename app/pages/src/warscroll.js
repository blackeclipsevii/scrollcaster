
class WarscrollSettings {
    unit = null;
    local = null;
};

const warscrollPage = {
    settings: null,
    loadPage(settings) {
        if (!settings) {
            throw 'warscroll requires settings';
        }
        this.settings = settings;
        const thisPage = this;

        const displayChars = (unit) => {
            whClearDiv('char');
            _initializeCharDiv();

            const tbody = document.getElementById("characteristics");
            
            // Clear existing rows
            tbody.innerHTML = "";

            if (!unit.Health)
                return;
            
            let headers = ['Move', 'Health', 'Control', 'Save'];
            let ward = null;
            unit.keywords.every(keyword => {
                if (keyword.startsWith('WARD')) {
                    ward = keyword.match(/\(([^)]+)\)/)[1].trim();
                    return false;
                }
                return true;
            });

            if (ward) {
                headers.push('Ward');
            }

            const hdrRow = document.createElement("tr");
            headers.forEach(cellData => {
                const cell = document.createElement("th");
                cell.className = 'characteristics';
                if (ward)
                    cell.style.width = '20%';
                cell.textContent = cellData;
                hdrRow.appendChild(cell);
            });
            tbody.appendChild(hdrRow);

            const dataRow = document.createElement("tr");
            headers.forEach(cellData => {
                const cell = document.createElement("td");
                cell.className = 'characteristics';
                if (ward)
                    cell.style.width = '20%';
                cell.textContent = cellData === 'Ward' ? ward : unit[cellData];
                dataRow.appendChild(cell);
            });
            tbody.appendChild(dataRow);
        }

        const displayKeywords = (unit) => {
            whClearDiv('keywords');
            _initializeKeywordsDiv();
            const keywords = document.getElementById("keywords");
            keywords.innerHTML = unit['keywords'].join(', ');
            keywords.style.margin = '1em';
        }

        const _initializeKeywordsDiv = () => {
            const div = document.getElementById('keywords-section');
            div.style.display = '';

            let keywords = document.createElement('h5');
            keywords.id = 'keywords';

            div.appendChild(keywords);
            return div;
        }

        const displayUnitDetails = (unit) => {
            // hero
            if (unit.type !== 0 || !unit.battleProfile)  {
                return;
            }
            
            const formatText = (message) => {
                return message.replace(/</g, "#")
                            .replace(/>/g, '%')
                            .replace(/#/g, '<b>')
                            .replace(/%/g, '</b>');
            }

            const div = document.getElementById('unit-details-section');
            div.style.display = '';
            
            let title = div.querySelector('.section-title');
            title.textContent = 'Regiment Options';

            unit.battleProfile.regimentOptions;
            const options = formatText(unit.battleProfile.regimentOptions).split(',');
            let content = document.createElement('p');
            content.style.paddingLeft = '1em';
            options.forEach(option => {
                content.innerHTML = `${content.innerHTML}\u2022 ${option.trim()}<br/>`;
            });
            div.appendChild(content);
        }

        const _initializeCharDiv = () => {
            let div = document.getElementById('characteristics-section');
            div.style.display = '';

            const title = div.querySelector('.draggable-grip');
            title.style.display = 'none';

            let characteristics = document.createElement('table');
            characteristics.id = 'characteristics';
            characteristics.className = 'characteristics';

            div.appendChild(characteristics);
            return div;
        }

        const filterWeapons = (unit, qualifier) => {
            const isTypeFilter = (weapon) => {
                if (qualifier === 'melee')
                    return weapon.type === 0;
                return weapon.type === 1;
            }

            const weaponList = unit.weapons.filter(isTypeFilter);
            unit.optionSets.forEach(optionSet => {
                if (DYNAMIC_WARSCROLL && optionSet.selection) {
                    optionSet.selection.weapons.forEach(weapon => {
                        if (isTypeFilter(weapon)) {
                            weaponList.push(weapon);
                        };
                    });
                }
                else {
                    // display all options
                    const options = Object.values(optionSet.options);
                    options.forEach(option => {
                        option.weapons.forEach(weapon => {
                            if (isTypeFilter(weapon)) {
                                const clone = JSON.parse(JSON.stringify(weapon));
                                clone.name = `${weapon.name} <${optionSet.name}>`
                                weaponList.push(clone);
                            }
                        });
                    });
                }
            });
            return weaponList;
        }

        async function readUnit() {
            if (thisPage.settings.local) {
                const json = localStorage.getItem(thisPage.settings.local);
                thisPage.settings.unit = JSON.parse(json);
            }

            const _display = (unit) => {
                setHeaderTitle(unit.name);
                displayChars(unit);
                const rangedWeapons = filterWeapons(unit, 'ranged');
                const meleeWeapons = filterWeapons(unit, 'melee');
                WeaponWidget.display(rangedWeapons);
                WeaponWidget.display(meleeWeapons);
                AbilityWidget.display(unit, unit);
                const abSec = document.getElementById('abilities-section');
                abSec.style.display = '';
                displayUnitDetails(unit);
                displayKeywords(unit);
            }

            _display(thisPage.settings.unit);
        }
        
        const _makeUnitLayout = () => {
            const sections = [
                'Characteristics', 
                'Ranged Weapons', 
                'Melee Weapons', 
                'Abilities',
                'Unit Details',
                'Keywords'
            ];
            makeLayout(sections);
            // clear unused elements
            const main = document.getElementById('loading-content');
            const _sections = main.querySelectorAll('.section');
            _sections.forEach(section => {
                const itemList = section.querySelector('.item-list');
                itemList.parentElement.removeChild(itemList);
            })
        }
        _makeUnitLayout();
        disableHeaderContextMenu();
        hidePointsOverlay();
        readUnit();
        window.scrollTo(0, 0);
        swapLayout();
        initializeDraggable('warscroll');
    }
};

dynamicPages['warscroll'] = warscrollPage;