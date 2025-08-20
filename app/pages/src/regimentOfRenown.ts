
import { displayPoints } from "../../lib/host.js";
import { makeSelectableItemName, makeSelectableItemType } from "../../lib/widgets/helpers.js";
import { makeLayout } from "../../lib/widgets/layout.js";
import { setHeaderTitle, disableHeaderContextMenu, getPageRouter } from "../../lib/widgets/header.js";
import { hidePointsOverlay } from "../../lib/widgets/displayPointsOverlay.js";
import { swapLayout } from "../../lib/widgets/layout.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { AbilityWidget } from "../../lib/widgets/AbilityWidget.js";
import UnitInterf from "../../shared-lib/UnitInterface.js";

import Settings from "./settings/Settings.js";
import RegimentOfRenownSettings from "./settings/RegimentOfRenownSettings.js";
import WarscrollSettings from "./settings/WarscrollSettings.js";

const rorPage = {
    settings: null as RegimentOfRenownSettings | null,
    loadPage(settings: Settings) {
        const thisPage = this;
        thisPage.settings = settings as RegimentOfRenownSettings;
        const displayUnits = () => {
            const makeItem = (unit: UnitInterf, onclick: ((this: HTMLDivElement, ev: MouseEvent) => any), listName = 'army-list', points=null) => {
                const itemList = document.getElementById(listName);
                if (!itemList) {
                    return;
                }
                const item = document.createElement('div');
                item.classList.add('selectable-item');
            
                // Clicking the container navigates to details
                item.addEventListener('click', onclick);
            
                const left = document.createElement('div');
                left.classList.add('selectable-item-left');
                
                const nameEle = makeSelectableItemName(unit.name);
                left.appendChild(nameEle);

                const roleEle = makeSelectableItemType(unit);
                left.appendChild(roleEle);
            
                const right = document.createElement('div');
                right.classList.add('selectable-item-right');
                
                if (points) {
                    const pts = document.createElement('span');
                    pts.className = 'points-label';
                    displayPoints(pts, points);
                    right.append(pts);
                }
            
                item.append(left, right);
                itemList.appendChild(item);
                return item;
            }

            if (thisPage.settings && thisPage.settings.ror) {
                const regiment = thisPage.settings.ror;
                let containers = regiment.unitContainers;
                if (containers.length > 1)
                    containers = containers.sort((a,b) => a.unit.type - b.unit.type);
                for (let i = 0; i < containers.length; ++i) {
                    const unitContainer = containers[i];
                    makeItem(unitContainer.unit, () => {
                        const settings = new WarscrollSettings;
                        settings.unit = unitContainer.unit;
                        getPageRouter()?.goTo(settings);
                    }, 'warscrolls-list');
                }   
            }
        }

        const displayAbilities = () => {
            if (thisPage.settings === null || !thisPage.settings.ror)
                return;

            if (thisPage.settings.ror.upgrades.length === 0) {
                const section = document.getElementById('abilities-section');
                if (section)
                    section.style.display = 'none';
                return;
            }
            AbilityWidget.display(
                thisPage.settings.ror.upgrades,
                thisPage.settings.ror.name);
        }

        const displayDetails = () => {
            if (thisPage.settings === null || thisPage.settings.ror === null)
                return;

            const div = document.getElementById('regiment-details-section') as HTMLElement;
            div.style.display = '';
            const container = div.querySelector('.item-list') as HTMLElement;
            container.className = 'details-container';

            let title = document.createElement('h4');
            title.innerHTML = 'Regiment Includes:'
            container.appendChild(title);
            
            const regiment = thisPage.settings.ror;
            for (let i = 0; i < regiment.unitContainers.length; ++i) {
                const unitContainer = regiment.unitContainers[i];

                const unitCount = document.createElement('p');
                unitCount.className = 'bullet-point';
                unitCount.innerHTML = `\u2022 ${unitContainer.min} ${unitContainer.unit.name}`;
                if (unitContainer.unit.models.length > 1 ||
                    unitContainer.unit.models[0].min > 1)
                    unitCount.innerHTML += ' unit';

                if (unitContainer.min > 1)
                    unitCount.innerHTML += 's';
                
                container.appendChild(unitCount);
            } 
            
            // points
            const points = document.createElement('p');
            points.innerHTML = `${regiment.points} points`;    
            container.appendChild(points);

            title = document.createElement('h4');
            title.innerHTML = 'Regiment can be added to:'
            container.appendChild(title);
            
            const sortedSi = thisPage.settings.ror.selectableIn.sort((a,b) => a.localeCompare(b));
            sortedSi.forEach(si => {
                const armyName = document.createElement('p');
                armyName.className = 'bullet-point';
                armyName.innerHTML = `\u2022 ${si}`;
                container.appendChild(armyName);
            });
        }
        
        const _makeUnitLayout = () => {
            const sections = [
                'Warscrolls', 
                'Abilities',
                'Regiment Details'
            ];
            makeLayout(sections, null, null, true);
        }
        if (thisPage.settings.ror)
            setHeaderTitle(thisPage.settings.ror.name);

        _makeUnitLayout();
        disableHeaderContextMenu();
        hidePointsOverlay();
        window.scrollTo(0, 0);
        displayUnits();
        displayAbilities();
        displayDetails();
        swapLayout();
        initializeDraggable('regimentofrenown');
    }
};

export const registerRegimentOfRenownPage = () => {
    getPageRouter()?.registerPage('regimentofrenown', rorPage);
}