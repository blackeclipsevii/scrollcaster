const params = new URLSearchParams(window.location.search);
let core = params.get('core');

const rosterId = params.get('id');
var armyName = params.get('army') || params.get('armyName');
const displayLegends = params.get('legends');

const auxiliary = params.get('auxiliary');
const hasRegimentIndex = params.has('regimentIndex');
const regimentIndex = auxiliary ? 0 : Number(params.get('regimentIndex'));

let type = params.get('type');
if (type)
    type = decodeURI(type);

const isLore = type && type.toLowerCase().includes('lore')


const unitPage = {
    loadPage: () => {
        function getUnitList(unit) {
            let unitList = null;
            if (unit.type === 0) {
                unitList = document.getElementById('hero-list');
            } else if (unit.type == 1) {
                unitList = document.getElementById('infantry-list');
            } else if (unit.type == 2) {
                unitList = document.getElementById('cavalry-list');
            } else if (unit.type == 3) {
                unitList = document.getElementById('beast-list');
            } else if (unit.type == 4) {
                unitList = document.getElementById('monster-list');
            } else if (unit.type == 5) {
                unitList = document.getElementById('war-machine-list');
            } else if (unit.type == 6) {
                unitList = document.getElementById('manifestations-list');
            } else if (unit.type == 7) {
                unitList = document.getElementById('faction-terrain-list');
            } else {
                unitList = document.getElementById('manifestations-list');
            }
            return unitList;
        }

        const typeToStr = (unit) => {
            if (unit.type === 0)
                return 'Hero';
            if (unit.type == 1)
                return 'Infantry';
            if (unit.type == 2)
                return 'Cavalry';
            if (unit.type == 3)
                return 'Beast';
            if (unit.type == 4)
                return 'Monster';
            if (unit.type == 5)
                return 'War Machine';
            if (unit.type == 6)
                return 'Manifestation';
            if (unit.type == 7)
                return 'Faction Terrain';
            return 'Regiment of Renown';
        }

        var armyUnitCounts = null;

        const _getUnitCounts = () => {
            class ArmyUnitCounts {
                updateCount (unit) {
                    let currentCount = this[unit.id]
                    if (!currentCount)
                        currentCount = 0;
                    this[unit.id] = currentCount + 1;
                }
            };

            const armyUnitCounts = new ArmyUnitCounts();
            if (!roster) {
                return armyUnitCounts;
            }

            roster.regiments.forEach(reg =>{
                reg.units.forEach(unit =>{
                    armyUnitCounts.updateCount(unit);
                });
            });

            roster.auxiliaryUnits.forEach(unit => {
                armyUnitCounts.updateCount(unit);
            });

            return armyUnitCounts;
        }

        // Standard method of making the name text
        const _makeTypeText = (typedObj) => {
            const nameEle = document.createElement('p');
            nameEle.className = 'selectable-item-type ability-label';
            nameEle.style.display = 'inline-block';
            nameEle.textContent = typeToStr(typedObj);
            nameEle.style.fontSize = '10px';
            nameEle.style.backgroundColor = 'grey';
            nameEle.style.marginRight = '1em';
            return nameEle;
        }

        // Standard method of making the name text
        const _makeNameElement = (namedObj) => {
            const nameEle = document.createElement('p');
            nameEle.className = 'selectable-item-name';
            nameEle.textContent = namedObj.name;
            nameEle.style.padding = '0px';
            nameEle.style.margin = '0px';
            return nameEle;
        }

        // element for the 1x Unit in Army display
        const _makeQuantityElement = () => {
            const quantityEle = document.createElement('p');
            quantityEle.style.fontSize = '10px';
            quantityEle.className = 'ability-label';
            quantityEle.style.backgroundColor = 'rgb(0,0,0,0)';
            quantityEle.style.color = 'rgb(0,0,0,0)';
            return quantityEle;
        }

        // Update the quantity element
        const _updateCountDisplay = (identifiableObj, selectableItem, quantityEle, message) => {
            const count = armyUnitCounts[identifiableObj.id];
            if (count) {
                quantityEle.textContent = `${armyUnitCounts[identifiableObj.id]}x ${message}`;
                quantityEle.style.backgroundColor = 'grey';
                quantityEle.style.color = 'white';
                selectableItem.classList.remove('not-added');
            } else {
                quantityEle.textContent = 'None';
                selectableItem.classList.add('not-added');
            }
        }

        const _makeSelectableItem = (displayableObj, unitList, leftOnClick, addOnClick=null, countMessage=null) => {
            const section = unitList.closest('.section');
            section.style.display = 'block';

            const item = document.createElement('div');
            item.classList.add('selectable-item');

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            left.addEventListener('click', leftOnClick);

            const nameEle = _makeNameElement(displayableObj);
            left.appendChild(nameEle);

            const roleEle = _makeTypeText(displayableObj);
            left.appendChild(roleEle);

            let quantityEle = null;
            if (addOnClick && countMessage) {
                quantityEle = _makeQuantityElement();
                left.appendChild(quantityEle);
                _updateCountDisplay(displayableObj, item, quantityEle, countMessage);
            }
            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            const points = document.createElement('span');
            points.className = 'points-label';
            displayPoints(points, displayableObj.points);

            const onchange = newFavoritesOnChange(unitList, item, displayableObj.name);
            const typeStr = `${displayableObj.type}`;
            const heart = newFavoritesCheckbox(displayableObj.id, typeStr, onchange);

            right.append(heart, points);
            if (addOnClick) {
                const addBtn = document.createElement('button');
                addBtn.classList.add('rectangle-button');
                addBtn.textContent = '+';
                addBtn.addEventListener('click', async (event) => {
                    await addOnClick(event);
                    if (quantityEle)
                        _updateCountDisplay(displayableObj, item, quantityEle, countMessage);
                });
                right.append(addBtn);
            }
            
            item.append(left, right);
            unitList.appendChild(item);
            
            if (heart.checked)
                onchange(true, displayableObj.id, typeStr);

            return item;
        };


        async function loadUnitsForCatalog() {
            let url = `${endpoint}/units`;
            if (armyName) {
                url = `${url}?army=${armyName}`
            }
            await fetch(encodeURI(url)).
            then(resp => resp.json()).
            then(units => {
                let unitIds = Object.getOwnPropertyNames(units);
                unitIds.forEach(id => {
                    const unit = units[id];
                    const unitList = getUnitList(unit);
                    if (!unitList)
                        return;

                    const displayOnClick = () => {
                        const key = _inCatalog ? 'readMyScrollCat' : 'readMyScrollArmy';
                        localStorage.setItem(key, JSON.stringify(unit));
                        goTo(`/pages/warscroll/warscroll.html?local=${key}`);
                    };
                    const selectable = _makeSelectableItem(unit, unitList, displayOnClick);
                });
                loadScrollData();
            });
        }

        async function loadUnits() {
            roster = await getRoster(rosterId);
            armyUnitCounts = _getUnitCounts();

            displayPointsOverlay(rosterId);
            refreshPointsOverlay(rosterId);
            updateValidationDisplay();

            const isNewRegiment = hasRegimentIndex && roster.regiments[regimentIndex].units.length === 0;

            const loadRor = async () => {
                await fetch(encodeURI(`${endpoint}/regimentsOfRenown?army=${roster.army}`)).
                then(resp => resp.json()).
                then(units => {
                    units.forEach(regimentOfRenown => {
                        const unitList = document.getElementById('ror-unit-list');
                        if (!unitList)
                            return;

                        const countMessage = 'Regiment in Army';

                        const displayInfoOnClick = () => {
                            displayUpgradeOverlay(regimentOfRenown.upgrades);
                        }

                        const addButtonOnClick = async (event) => {
                            event.stopPropagation(); // Prevents click from triggering page change
                            if (isNewRegiment) {
                                // we were making a new regiment but chose a ror
                                roster.regiments.splice(regimentIndex, 1);
                            }
                            roster.regimentOfRenown = regimentOfRenown;
                            await putRoster(roster);
                            goBack();
                        }

                        const seletableItem = _makeSelectableItem(
                            regimentOfRenown,
                            unitList, 
                            displayInfoOnClick, 
                            addButtonOnClick, 
                            countMessage);
                    });
                });
            }

            if (isNewRegiment && !roster.regimentOfRenown) {
                // we could make the regiment a ror
                await loadRor();
            }

            let url = `${endpoint}/units?army=${roster.army}`;
            if (hasRegimentIndex){
                regiment = roster.regiments[regimentIndex];
                if (regiment.units.length > 0)
                    url = `${url}&leaderId=${regiment.units[0].id}`;
            }
            await fetch(encodeURI(url)).
            then(resp => resp.json()).
            then(units => {
                const availableUnits = Object.values(units);
                availableUnits.forEach(unit => {
                    if (unit._tags.length > 0) {
                        console.log (`${unit.name} has tags: ${unit._tags.join(', ')}`);
                    }
                    if (!displayLegends && unit.keywords.includes('Legends'))
                        return;

                    if (type && !unit.keywords.includes(type.toUpperCase()))
                        return;

                    if (!type && unit.type > 5)
                        return;

                    if (isNewRegiment) {
                        // cant lead without a profile
                        if (!unit.battleProfile)
                            return;

                        // the profile explicitly says they cannot lead
                        if (unit.battleProfile.regimentOptions.toUpperCase() === 'NONE')
                            return;
                    }

                    const unitList = getUnitList(unit);
                    if (!unitList)
                        return;

                    const countMessage = 'Unit in army';
                    const displayInfoOnClick = () => {
                        const key = _inCatalog ? 'readMyScrollCat' : 'readMyScrollArmy';
                        localStorage.setItem(key, JSON.stringify(unit));
                        goTo(`/pages/warscroll/warscroll.html?local=${key}`);
                    };
                    const addButtonOnClick = async (event) => {
                        event.stopPropagation(); // Prevents click from triggering page change
                        if (auxiliary) {
                            roster.auxiliaryUnits.push(unit);
                        } else if (unit.type == 7) {
                            roster.terrainFeature = unit;
                        } else {
                            const regiment = roster.regiments[regimentIndex];
                            regiment.units.push(unit);
                        }

                        await putRoster(roster);
                        if (isNewRegiment) {
                            goBack();
                        } else {
                            armyUnitCounts.updateCount(unit);
                            totalPoints += unitTotalPoints(unit);
                            refreshPointsOverlay(roster.id);
                            updateValidationDisplay();
                        }
                    };
                    const seletableItem = _makeSelectableItem(
                        unit,
                        unitList,
                        displayInfoOnClick,
                        addButtonOnClick,
                        countMessage);
                });
                loadScrollData();
            });
        }

        const _makeUnitLayout = () => {
            const sections = [
                'Hero', 
                'Infantry', 
                'Cavalry', 
                'Beast', 
                'Monster', 
                'War Machine', 
                'Manifestations', 
                'Faction Terrain', 
                'Regiments of Renown'
            ];
            makeLayout(sections);
        }
        setHeaderTitle('Units');
        _makeUnitLayout();
        
        if (rosterId) {
            loadUnits();
        } else {
            let url = `/pages/list/list.html?loadScrollData=true&catalog=true`;
            if (armyName) {
                url = `${url}&army=${armyName}`
            }
            loadUnitsForCatalog();
        }
    }
}

addOverlayListener();
dynamicPages['units'] = unitPage;

if (params.get('catalog'))
    dynamicPages['catalog'].loadPage();
else if (params.get('upgrades'))
    dynamicPages['upgrades'].loadPage();
else if (params.get('tactics'))
    dynamicPages['tactics'].loadPage();
else
    dynamicPages['units'].loadPage();