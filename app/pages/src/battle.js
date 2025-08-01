
var totalPoints = 0;

class BattleSettings {
    roster = null;
};

const battlePage = {
    settings: null,
    roster: null,
    async loadPage(settings) {
        const thisPage = this;
        thisPage.settings = settings;
        if (!settings) {
            throw 'settings are required for the battle page';
        }

        thisPage.roster = thisPage.settings.roster;

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

            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            item.append(left, right);
            parentList.appendChild(item);
            
            return item;
        };
        
        async function displayRegimentOfRenown(unitSet, regiment, abilityContainer) {
            const item = makeSelectableItem(regiment.upgrades, true, abilityContainer, () => {
                displayRorOverlay(regiment);
            });

            const usName = item.querySelector('.selectable-item-name');
            usName.textContent = regiment.name;

            for (let i = 0; i < regiment.unitContainers.length; ++i) {
                const unitContainer = regiment.unitContainers[i];
                if (!unitSet[unitContainer.unit.id]) {
                    unitSet[unitContainer.unit.id] = unitContainer.unit;
                }
            }
        }


        function displayBattleTraits(parentContainer) {
            const traitNames = Object.getOwnPropertyNames(thisPage.roster.battleTraits);
            const trait = thisPage.roster.battleTraits[traitNames[0]];
            const onclick = () => {
                displayUpgradeOverlay(trait);
            };

            const item = makeSelectableItem(trait, false, parentContainer, onclick);

            const usName = item.querySelector('.selectable-item-name');
            usName.textContent = trait.name.replace("Battle Traits: ", "");

            const label = item.querySelector('.ability-label');
            label.textContent = 'Battle Traits';

            parentContainer.appendChild(item);
        }

        
        function displayBattleFormation(parentContainer) {
            makeSelectableItem(thisPage.roster.battleFormation, false, parentContainer, () => {
                displayUpgradeOverlay(thisPage.roster.battleFormation);
            });
        }

        async function displayTactics(parentContainer) {
            for (let i = 0; i < thisPage.roster.battleTacticCards.length; ++i) {
                const tactic = thisPage.roster.battleTacticCards[i];

                const item = makeSelectableItem(tactic, false, parentContainer, () => {
                    displayTacticsOverlay(tactic);
                });

                const label = item.querySelector('.ability-label');
                label.textContent = 'Battle Tactic Card';
            }
        }
        
        async function displayLore(name, loreContainer, onclick) {
            const lcName = name.toLowerCase();
            makeSelectableItem(thisPage.roster.lores[lcName], false, loreContainer, onclick);
        }

        async function getSpecificUnit(id, useArmy) {
            let url = `${endpoint}/units?id=${id}`;
            if (useArmy) {
                url = `${url}&army=${thisPage.roster.army}`;
            }

            try {
                const result = await fetchWithLoadingDisplay(encodeURI(url));
                return result;
            } catch (error) {
                return null;
            }
        }

        async function getManifestationUnits() {
            const ids = thisPage.roster.lores.manifestation.unitIds;
            let manifestations = [];
            let armySpecific = false;
            for (let i = 0; i < ids.length; ++i) {
                let unit = await getSpecificUnit(ids[i], armySpecific);
                if (!unit) {
                    armySpecific = !armySpecific;
                    unit = await getSpecificUnit(ids[i], armySpecific);
                }

                if (unit)
                    manifestations.push(unit);
            }
            return { units: manifestations, armyUnits: armySpecific };
        }
        
        async function displayManifestLore(loreContainer, warscrollContainer) {
            const lore = thisPage.roster.lores.manifestation;

            const item = displayLore('Manifestation', loreContainer, () => {
                displayUpgradeOverlay(thisPage.roster.lores.manifestation);
            });

            async function displayManifestations() {
                const result = await getManifestationUnits();

                for(let i = 0; i < result.units.length; ++i) {
                    const unit = result.units[i];
                    makeSelectableItem(unit, true, warscrollContainer, () => {
                        const settings = new WarscrollSettings;
                        settings.unit = unit;
                        dynamicGoTo(settings);
                    });
                }
            }
            
            displayManifestations();
        }

        async function loadArmy() {
            const unitSet = {};
            const enhancementSet = {};

            const warscrollSection = document.getElementById('warscrolls-section');
            const enhancementSection = document.getElementById('enhancements-section');
            const battleSection = document.getElementById('army-section');
            const loresSection = document.getElementById('lores-section');
            warscrollSection.style.display = '';
            const warscrollContainer = document.getElementById('warscrolls-list');
            const enhancementContainer = document.getElementById('enhancements-list');
            const battleContainer = document.getElementById('army-list');
            const loresContainer = document.getElementById('lores-list');

            // army abilites
            displayBattleTraits(battleContainer);

            if (thisPage.roster.battleFormation) 
                displayBattleFormation(battleContainer);

            const addEnhancements = (unit) => {
                const enhancements = ['heroicTrait', 'artefact', 'monstrousTrait'];
                enhancements.forEach(e => {
                    if (unit[e])
                        enhancementSet[unit[e].id] = unit[e];
                });
            }

            // units
            thisPage.roster.regiments.forEach(reg => {
                reg.units.forEach(unit => {
                    if (!unitSet[unit.id])
                        unitSet[unit.id] = unit;
                    addEnhancements(unit);
                });
            });

            thisPage.roster.auxiliaryUnits.forEach(unit => {
                if (!unitSet[unit.id])
                    unitSet[unit.id] = unit;
                addEnhancements(unit);
            });

            if (thisPage.roster.terrainFeature) {
                unitSet[thisPage.roster.terrainFeature.id] = thisPage.roster.terrainFeature;
            }

            if (thisPage.roster.regimentOfRenown)
                displayRegimentOfRenown(unitSet, thisPage.roster.regimentOfRenown, battleContainer);

            if (thisPage.roster.battleTacticCards.length > 0)
                displayTactics(battleContainer);

            let values = Object.values(unitSet);
            values.sort((a, b) => a.type - b.type);
            values.forEach(unit => {
                makeSelectableItem(unit, true, warscrollContainer, () => {
                    const wss = new WarscrollSettings;
                    wss.unit = unit;
                    dynamicGoTo(wss);
                });
            })

            // enhancements
            values = Object.values(enhancementSet);
            if (values.length > 0) {
                enhancementSection.style.display = '';
                values.forEach(enhancement => {
                    makeSelectableItem(enhancement, false, enhancementContainer, () => {
                        displayUpgradeOverlay(enhancement);
                    });
                });
            }

            // lore
            let unhideLore = false;
            if (thisPage.roster.lores.spell) {
                unhideLore = true;
                displayLore('Spell', loresContainer, () => {
                    displayUpgradeOverlay(thisPage.roster.lores.spell);
                });
            }

            if (thisPage.roster.lores.prayer){
                unhideLore = true;
                displayLore('Prayer', loresContainer, () => {
                    displayUpgradeOverlay(thisPage.roster.lores.prayer);
                });
            }

            if (thisPage.roster.lores.manifestation) {
                unhideLore = true;
                displayManifestLore(loresContainer, warscrollContainer);
            }

            if (unhideLore) {
                loresSection.style.display = '';
            }
            
            setHeaderTitle(`Battle View`);
        }

        const battleLoadPage = async () => {
            const sections = [
                'Warscrolls',
                'Army',
                'Enhancements',
                'Lores'
            ];

            hidePointsOverlay();
            disableHeaderContextMenu();
            
            makeLayout(sections);
            await loadArmy(true);
            swapLayout();
            initializeDraggable('battle');
        }

        await battleLoadPage();
    }
};

dynamicPages['battle'] = battlePage;
