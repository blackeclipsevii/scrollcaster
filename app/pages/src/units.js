
class UnitSettings {
    type = null;
    rosterId = null;
    regimentIndex = null;
    auxiliary = false;

    displayLegends = false;
    armyName = null;

    hasRegimentIndex() {
        return this.regimentIndex !== null;
    }
}

const unitPage = {
    settings: null,
    _cache: {
        units: null,
        regimentsOfRenown: null,
        armyName: null,
        leaderId: null
    },
    async fetchRor() {
        if (this._cache.regimentsOfRenown && this._cache.armyName === this.settings.armyName) {
            return this._cache.regimentsOfRenown;
        }
        let results = null;
        await fetch(encodeURI(`${endpoint}/regimentsOfRenown?army=${this.settings.armyName}`)).
        then(resp => resp.json()).
        then(units => results = units);
        this._cache.regimentsOfRenown = results;
        this._cache.armyName = this.settings.armyName;
        return results;
    },
    async fetchUnits(leaderId = null) {
        if (this._cache.units) {
            if (this._cache.armyName === this.settings.armyName &&
                this._cache.leaderId === leaderId
            ) {
                return this._cache.units;
            }
        }
        let response = null;
        
        let url = `${endpoint}/units`;
        if (thisPage.settings.armyName) {
            url = `${url}?army=${thisPage.settings.armyName}`
            if (leaderId) {
                // to-do move the leader filter client side and use the same cache
                url = `${url}&leaderId=${leaderId}`;
            }
        }

        await fetch(encodeURI(url)).
                    then(resp => resp.json()).
                    then(units => response = units);
        this._cache.units = response;
        this._cache.armyName = this.settings.armyName;
        this._cache.leaderId = leaderId;
        return response;
    },
    loadPage (settings) {
        if (!settings)
            settings = new UnitSettings;
        this.settings = settings;
        thisPage = this;

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


        const loadUnitsForCatalog = async () => {
            hidePointsOverlay();
            const units = await thisPage.fetchUnits();
            let unitIds = Object.getOwnPropertyNames(units);
            unitIds.forEach(id => {
                const unit = units[id];
                const unitList = getUnitList(unit);
                if (!unitList)
                    return;

                const displayOnClick = () => {
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
                };
                const selectable = _makeSelectableItem(unit, unitList, displayOnClick);
            });
        }

        async function loadUnits() {
            if (thisPage.settings.roster) {
                thisPage.settings.armyName = thisPage.settings.roster.army;
                roster = thisPage.settings.roster;
            } else {
                roster = await getRoster(thisPage.settings.rosterId);
            }
            
            armyUnitCounts = _getUnitCounts();

            displayPointsOverlay(roster.id);
            refreshPointsOverlay(roster.id);
            updateValidationDisplay();

            const isNewRegiment = thisPage.settings.hasRegimentIndex() && 
                                  roster.regiments[thisPage.settings.regimentIndex].units.length === 0;

            const loadRor = async () => {
                const units = await thisPage.fetchRor();
                
                units.forEach(regimentOfRenown => {
                    const unitList = document.getElementById('regiments-of-renown-list');
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
                            roster.regiments.splice(thisPage.settings.regimentIndex, 1);
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
            }

            if (isNewRegiment && !roster.regimentOfRenown) {
                // we could make the regiment a ror
                await loadRor();
            }

            let leaderId = null;
            if (thisPage.settings.hasRegimentIndex()){
                regiment = roster.regiments[thisPage.settings.regimentIndex];
                if (regiment.units.length > 0)
                    leaderId = regiment.units[0].id;
            }
            const units = await thisPage.fetchUnits(leaderId);
            const availableUnits = Object.values(units);
            availableUnits.forEach(unit => {
                if (unit._tags.length > 0) {
                    console.log (`${unit.name} has tags: ${unit._tags.join(', ')}`);
                }
                if (!thisPage.settings.displayLegends && unit.keywords.includes('Legends'))
                    return;

                if (thisPage.settings.type && !unit.keywords.includes(thisPage.settings.type.toUpperCase()))
                    return;

                if (thisPage.settings.type === null && unit.type > 5)
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
                    const settings = new WarscrollSettings;
                    settings.unit = unit;
                    dynamicGoTo(settings);
                };
                const addButtonOnClick = async (event) => {
                    event.stopPropagation(); // Prevents click from triggering page change
                    if (thisPage.settings.auxiliary) {
                        roster.auxiliaryUnits.push(unit);
                    } else if (unit.type == 7) {
                        roster.terrainFeature = unit;
                    } else {
                        const regiment = roster.regiments[thisPage.settings.regimentIndex];
                        regiment.units.push(unit);
                    }

                    await putRoster(roster);
                    if (isNewRegiment || unit.type == 7) {
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
        disableHeaderContextMenu();
        initializeFavoritesList();
        _makeUnitLayout();
        
        if (thisPage.settings.roster || thisPage.settings.rosterId) {
            loadUnits();
        } else {
            loadUnitsForCatalog();
        }
        swapLayout();
    }
}

dynamicPages['units'] = unitPage;