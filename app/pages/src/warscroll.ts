
import ModelInterf from "../../shared-lib/ModelInterface.js";
import OptionSet from "../../shared-lib/Options.js";
import UnitInterf from "../../shared-lib/UnitInterface.js";
import WeaponInterf, { WeaponSelectionPer, WeaponType } from "../../shared-lib/WeaponInterf.js";
import { DYNAMIC_WARSCROLL } from "../../lib/host.js";
import { AbilityWidget } from "../../lib/widgets/AbilityWidget.js";
import { hidePointsOverlay } from "../../lib/widgets/displayPointsOverlay.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { disableHeaderContextMenu, getPageRouter, setHeaderTitle } from "../../lib/widgets/header.js";
import { whClearDiv } from "../../lib/widgets/helpers.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { WeaponWidget } from "../../lib/widgets/WeaponWidget.js";

import Settings from "./settings/Settings.js";
import WarscrollSettings from "./settings/WarscrollSettings.js";

const warscrollPage = {
    settings: new WarscrollSettings,
    loadPage(settings: Settings) {
        if (!settings) {
            throw 'warscroll requires settings';
        }
        this.settings = settings as WarscrollSettings;
        const thisPage = this;

        const displayChars = (unit: UnitInterf) => {
            whClearDiv('char');
            _initializeCharDiv();

            if (unit.Move === '' && unit.Health === '' && unit.Control === '' && unit.Save === '')
                return;

            const tbody = document.getElementById("characteristics") as HTMLElement;
            
            // Clear existing rows
            tbody.innerHTML = "";

            let headers = ['Move', 'Health', 'Control', 'Save'];
            let ward: string | null = null;
            unit.keywords.every(keyword => {
                if (keyword.startsWith('WARD')) {
                    const result = keyword.match(/\(([^)]+)\)/);
                    if (result) {
                        ward = result[1].trim();
                        return false;
                    }
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
                // move health control save
                cell.textContent = cellData === 'Ward' ? ward : (unit as unknown as {[name: string]: string})[cellData];
                dataRow.appendChild(cell);
            });
            tbody.appendChild(dataRow);
        }

        const displayKeywords = (unit: UnitInterf) => {
            whClearDiv('keywords');
            _initializeKeywordsDiv();
            const keywords = document.getElementById("keywords") as HTMLElement;
            keywords.innerHTML = unit['keywords'].join(', ');
            keywords.style.margin = '1em';
        }

        const _initializeKeywordsDiv = () => {
            const div = document.getElementById('keywords-section') as HTMLElement;
            div.style.display = '';

            let keywords = document.createElement('h5');
            keywords.id = 'keywords';

            div.appendChild(keywords);
            return div;
        }

        const filterWeapons = (unitOrModel: UnitInterf | ModelInterf, qualifier: string | null = null) => {
            let weaponSet: {[name: string]: WeaponInterf} = {};
            const isTypeFilter = (weapon: WeaponInterf) => {
                if (qualifier === null) 
                    return true;

                if (qualifier === 'melee')
                    return weapon.type === WeaponType.Melee;
                
                return weapon.type === WeaponType.Ranged;
            }

            const addToSet = (weapon: WeaponInterf) => {
                weaponSet[weapon.name] = weapon;
            }

            const doOptionSets = (optionSets: OptionSet[]) => {
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

            const handleWeapons = (model: ModelInterf) => {
                // models is now an object with selectable weapons
                const weaponList = model.weapons.warscroll.filter(isTypeFilter);
                weaponList.forEach(weapon => addToSet(weapon));

                const selections = Object.values(model.weapons.selections);
                selections.forEach(selection => {
                    selection.weapons.forEach(weapon => {
                        if (isTypeFilter(weapon)) {
                            addToSet(weapon);
                        }
                    });
                });
                doOptionSets(model.optionSets);
            }
           
            if ((unitOrModel as ModelInterf).weapons) {
                handleWeapons(unitOrModel as ModelInterf);
            }

            if ((unitOrModel as UnitInterf).models) {
                (unitOrModel as UnitInterf).models.forEach(model => {
                    handleWeapons(model);
                });
            }
            return Object.values(weaponSet);
        }

        const displayUnitDetails = (unit: UnitInterf) => {
            const formatText = (message: string) => {
                return message.replace(/</g, "#")
                            .replace(/>/g, '%')
                            .replace(/#/g, '<b>')
                            .replace(/%/g, '</b>');
            }

            const div = document.getElementById('unit-details-section') as HTMLElement;
            div.style.display = '';

            const container = document.createElement('div');
            container.className = 'details-container';
            div.appendChild(container);
            
            let title = div.querySelector('.section-title') as HTMLHeadingElement;
            title.textContent = 'Unit Details';

            // details
            if (unit.models) {
                let nModels = 0;
                unit.models.forEach(model => {
                    nModels += model.min;
                });
                if (nModels > 0) {
                    const modelCount = document.createElement('p');
                    modelCount.className = 'bullet-point';
                    modelCount.innerHTML = `\u2022 ${nModels} model`;    
                    if (nModels > 1)
                        modelCount.innerHTML += 's';
                    container.appendChild(modelCount);
                }

                if (unit.models.length > 1) {
                    unit.models.forEach(model => {
                        const weapons = filterWeapons(model).map(weapon => weapon.name).join(', ');
                        const loadoutInfo = document.createElement('p');
                        loadoutInfo.innerHTML = `<b>${model.name}</b> is armed with <i>${weapons}</i>`;
                        container.appendChild(loadoutInfo);
                    });
                }

                // mention selectable weapons
                unit.models.forEach(model => {
                    const selections = Object.values(model.weapons.selections);
                    selections.forEach(availableSelection => {
                        if (availableSelection.max !== -1 && 
                            availableSelection.per === WeaponSelectionPer.Unit) {
                            const weaponDisclaimer = document.createElement('p');
                            const otherOptions = availableSelection.replaces.map(id => model.weapons.selections[id].name).join(', ');
                            weaponDisclaimer.innerHTML = `${availableSelection.max}/${model.min} models can replace their <i>${otherOptions}</i> with a <i>${availableSelection.name}</i>`;
                            container.appendChild(weaponDisclaimer);
                        }
                    });
                });
            }

            // points
            const points = document.createElement('p');
            points.innerHTML = `${unit.points} points`;    
            container.appendChild(points);


            // regiment options
            (() => {
                // hero
                if (unit.type !== 0 || !unit.battleProfile)  {
                    return;
                }
            
                const bpTitle = document.createElement('h5');
                bpTitle.textContent = 'Regiment Options';
                container.appendChild

                unit.battleProfile.regimentOptions;
                const options = formatText(unit.battleProfile.regimentOptions).split(',');
                let content = document.createElement('p');
                content.className = 'bullet-point';
                options.forEach(option => {
                    content.innerHTML = `${content.innerHTML}\u2022 ${option.trim()}<br/>`;
                });
                container.append(bpTitle, content);
            })();
        }

        const _initializeCharDiv = () => {
            let div = document.getElementById('characteristics-section') as HTMLElement;
            div.style.display = '';

            const title = div.querySelector('.draggable-grip') as HTMLElement;
            title.style.display = 'none';

            let characteristics = document.createElement('table');
            characteristics.id = 'characteristics';
            characteristics.className = 'characteristics';

            div.appendChild(characteristics);
            return div;
        }

        async function readUnit() {
            const _display = (unit: UnitInterf | null) => {
                if (!unit)
                    return;
                setHeaderTitle(unit.name);
                displayChars(unit);
                const rangedWeapons = filterWeapons(unit, 'ranged');
                const meleeWeapons = filterWeapons(unit, 'melee');
                WeaponWidget.display(rangedWeapons);
                WeaponWidget.display(meleeWeapons);
                AbilityWidget.display(unit, unit.name);
                const abSec = document.getElementById('abilities-section') as HTMLElement;
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
            const main = document.getElementById('loading-content') as HTMLElement;
            const _sections = main.querySelectorAll('.section');
            _sections.forEach(section => {
                const itemList = section.querySelector('.item-list');
                if (itemList && itemList.parentElement)
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

export const registerWarscrollPage = () => {
    getPageRouter()?.registerPage('warscroll', warscrollPage);
}
