
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

        const filterWeapons = (unitOrModel, qualifier=null) => {
            let weaponSet = {};
            const isTypeFilter = (weapon) => {
                if (qualifier === null) 
                    return true;

                if (qualifier === 'melee')
                    return weapon.type === 0;
                
                return weapon.type === 1;
            }

            const addToSet = (weapon) => {
                weaponSet[weapon.name] = weapon;
            }

            const doOptionSets = (optionSets) => {
                optionSets.forEach(optionSet => {
                    if (DYNAMIC_WARSCROLL && optionSet.selection) {
                        optionSet.selection.weapons.forEach(weapon => {
                            if (isTypeFilter(weapon)) {
                                addToSet(weapon);
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
                                    addToSet(clone);
                                }
                            });
                        });
                    }
                });
            }

            if (unitOrModel.weapons) { // backwards compatibility 8/8/25
                const weaponList = unitOrModel.weapons.filter(isTypeFilter);
                weaponList.forEach(weapon => addToSet(weapon));
                doOptionSets(unitOrModel.optionSets);
            }

            // to-do display model weapons in different sections
            if (unitOrModel.models) {
                unitOrModel.models.forEach(model => {
                    const modelWeaponList = model.weapons.filter(isTypeFilter);
                    modelWeaponList.forEach(weapon => addToSet(weapon));
                    doOptionSets(model.optionSets);
                });
            }
            return Object.values(weaponSet);
        }

        const displayUnitDetails = (unit) => {
            const formatText = (message) => {
                return message.replace(/</g, "#")
                            .replace(/>/g, '%')
                            .replace(/#/g, '<b>')
                            .replace(/%/g, '</b>');
            }

            const div = document.getElementById('unit-details-section');
            div.style.display = '';
            
            let title = div.querySelector('.section-title');
            title.textContent = 'Unit Details';

            // details
            if (unit.models) {
                let nModels = 0;
                unit.models.forEach(model => {
                    nModels += model.min;
                });
                if (nModels > 0) {
                    const modelCount = document.createElement('p');
                    modelCount.style.paddingLeft = '1em';
                    modelCount.innerHTML = `\u2022 ${nModels} model`;    
                    if (nModels > 1)
                        modelCount.innerHTML += 's';
                    div.appendChild(modelCount);
                }

                if (unit.models.length > 1) {
                    unit.models.forEach(model => {
                        const weapons = filterWeapons(model).map(weapon => weapon.name).join(', ');
                        const loadoutInfo = document.createElement('p');
                        loadoutInfo.style.paddingLeft = '1em';
                        loadoutInfo.innerHTML = `<b>${model.name}</b> is armed with <i>${weapons}</i>`;
                        div.appendChild(loadoutInfo);
                    });
                }
            }

            // points
            const points = document.createElement('p');
            points.style.paddingLeft = '1em';
            points.innerHTML = `${unit.points} points`;    
            div.appendChild(points);


            // regiment options
            (() => {
                // hero
                if (unit.type !== 0 || !unit.battleProfile)  {
                    return;
                }
            
                const bpTitle = document.createElement('h5');
                bpTitle.style.paddingLeft = '1em';
                bpTitle.textContent = 'Regiment Options';
                div.appendChild

                unit.battleProfile.regimentOptions;
                const options = formatText(unit.battleProfile.regimentOptions).split(',');
                let content = document.createElement('p');
                content.style.paddingLeft = '1em';
                options.forEach(option => {
                    content.innerHTML = `${content.innerHTML}\u2022 ${option.trim()}<br/>`;
                });
                div.append(bpTitle, content);
            })();
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