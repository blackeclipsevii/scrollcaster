
class RegimentOfRenownSettings {
    ror = null;
};

const rorPage = {
    settings: null,
    loadPage(settings) {
        const thisPage = this;
        thisPage.settings = settings;

        displayUnits = () => {
            const makeItem = (unit, onclick, listName = 'army-list', points=null) => {
                const itemList = document.getElementById(listName);
                const item = document.createElement('div');
                item.classList.add('selectable-item');
            
                // Clicking the container navigates to details
                item.addEventListener('click', onclick);
            
                const left = document.createElement('div');
                left.classList.add('selectable-item-left');
                
                const nameEle = makeSelectableItemName(unit.name);
                left.appendChild(nameEle);

                const roleEle = makeSelectableItemType(unit, true);
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

            const regiment = thisPage.settings.ror;
            let containers = regiment.unitContainers;
            if (containers.length > 1)
                containers = containers.sort((a,b) => a.unit.type - b.unit.type);
            for (let i = 0; i < containers.length; ++i) {
                const unitContainer = containers[i];
                makeItem(unitContainer.unit, () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unitContainer.unit;
                    dynamicGoTo(settings);
                }, 'warscrolls-list');
            }   
        }

        displayAbilities = () => {
            if (thisPage.settings.ror.upgrades.length === 0) {
                const section = document.getElementById('abilities-section');
                section.style.display = 'none';
                return;
            }
            AbilityWidget.display(
                thisPage.settings.ror.upgrades,
                thisPage.settings.ror.name);
        }

        displayDetails = () => {
            const div = document.getElementById('regiment-details-section');
            div.style.display = '';
            const container = div.querySelector('.item-list');
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
            
            const sortedSi =thisPage.settings.ror.selectableIn.sort((a,b) => a.localeCompare(b));
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

dynamicPages['regimentofrenown'] = rorPage;