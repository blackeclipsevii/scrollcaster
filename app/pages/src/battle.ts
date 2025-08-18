import { Force } from "../../shared-lib/Force.js";
import LoreInterf from "../../shared-lib/LoreInterface.js";
import RosterInterf from "../../shared-lib/RosterInterface.js";
import UnitInterf from "../../shared-lib/UnitInterface.js";
import UpgradeInterf from "../../shared-lib/UpgradeInterface.js";
import { endpoint } from "../../lib/endpoint.js";
import { dynamicPages } from "../../lib/host.js";
import { fetchWithLoadingDisplay } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";
import { hidePointsOverlay } from "../../lib/widgets/displayPointsOverlay.js";
import { displayTacticsOverlay } from "../../lib/widgets/displayTacticsOverlay.js";
import { displayRorOverlay, displayUpgradeOverlay } from "../../lib/widgets/displayUpgradeOverlay.js";
import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { disableHeaderContextMenu, dynamicGoTo, setHeaderTitle, Settings } from "../../lib/widgets/header.js";
import { makeSelectableItem } from "../../lib/widgets/helpers.js";
import { makeLayout, swapLayout } from "../../lib/widgets/layout.js";
import { WarscrollSettings } from "./warscroll.js";

export class BattleSettings implements Settings {
    [name: string]: unknown;
    roster = null as RosterInterf | null;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Battle';
    }
    toUrl() {
        if (this.roster)
            return `${window.location.origin}?page=${this.pageName}&roster=${this.roster.id}`;
        return window.location.origin;
    }
};

interface UnitSet {
    [name: string]: UnitInterf;
}

interface UpgradeSet {
    [name: string]: UpgradeInterf;
}

const battlePage = {
    settings: new BattleSettings,
    async loadPage(settings: Settings) {
        const thisPage = this;
        thisPage.settings = settings as BattleSettings;
        if (!settings) {
            throw 'settings are required for the battle page';
        }

        if (!thisPage.settings.roster) {
            throw 'a roster is required for the battle page';
        }

        const roster = thisPage.settings.roster;

        async function displayRegimentOfRenown(unitSet: UnitSet, regiment: Force, abilityContainer: HTMLElement) {
            const item = makeSelectableItem(regiment.upgrades[0], true, abilityContainer, () => {
                displayRorOverlay(regiment);
            });

            if (!item)
                return;

            const usName = item.querySelector('.selectable-item-name') as HTMLElement;
            usName.textContent = regiment.name;

            for (let i = 0; i < regiment.unitContainers.length; ++i) {
                const unitContainer = regiment.unitContainers[i];
                if (!unitSet[unitContainer.unit.id]) {
                    unitSet[unitContainer.unit.id] = unitContainer.unit;
                }
            }
        }


        function displayBattleTraits(parentContainer: HTMLElement) {
            const traitNames = Object.getOwnPropertyNames(roster.battleTraits);
            const trait = roster.battleTraits[traitNames[0]];
            const onclick = () => {
                displayUpgradeOverlay(trait);
            };

            const item = makeSelectableItem(trait, false, parentContainer, onclick);
            if (!item)
                return;

            const usName = item.querySelector('.selectable-item-name') as HTMLElement;
            usName.textContent = trait.name.replace("Battle Traits: ", "");

            const label = item.querySelector('.ability-label') as HTMLElement;
            label.textContent = 'Battle Traits';

            parentContainer.appendChild(item);
        }

        
        function displayBattleFormation(parentContainer: HTMLElement) {
            if (roster.battleFormation) {
                makeSelectableItem(roster.battleFormation, false, parentContainer, () => {
                    displayUpgradeOverlay(roster.battleFormation);
                });
            }
        }

        async function displayTactics(parentContainer: HTMLElement) {
            for (let i = 0; i < roster.battleTacticCards.length; ++i) {
                const tactic = roster.battleTacticCards[i];

                const item = makeSelectableItem(tactic, false, parentContainer, () => {
                    displayTacticsOverlay(tactic);
                });
                if (!item) {
                    continue;
                }

                const label = item.querySelector('.ability-label') as HTMLElement;
                label.textContent = 'Battle Tactic Card';
            }
        }
        
        async function displayLore(name: string, loreContainer: HTMLElement, onclick: (this: HTMLDivElement, ev: MouseEvent) => any) {
            const lcName = name.toLowerCase();
            makeSelectableItem((roster.lores as unknown as {[name:string]: LoreInterf})[lcName], false, loreContainer, onclick);
        }

        async function getSpecificUnit(id: string, useArmy: boolean) {
            let url = `${endpoint}/units?id=${id}`;
            if (useArmy) {
                url = `${url}&army=${roster.army}`;
            }

            try {
                const result = await fetchWithLoadingDisplay(encodeURI(url));
                return result;
            } catch (error) {
                return null;
            }
        }

        async function getManifestationUnits() {
            if (!roster.lores.manifestation) {
                return null;
            }
            const ids = roster.lores.manifestation.unitIds;
            let manifestations: UnitInterf[] = [];
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
        
        async function displayManifestLore(loreContainer: HTMLElement, warscrollContainer: HTMLElement) {
            const lore = roster.lores.manifestation;

            const item = displayLore('Manifestation', loreContainer, () => {
                displayUpgradeOverlay(roster.lores.manifestation);
            });

            async function displayManifestations() {
                const result = await getManifestationUnits();
                if (!result)
                    return;

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
            const unitSet: UnitSet = {};
            const enhancementSet: UpgradeSet = {};

            const warscrollSection = document.getElementById('warscrolls-section') as HTMLElement;
            const enhancementSection = document.getElementById('enhancements-section') as HTMLElement;
            //const battleSection = document.getElementById('army-section');
            const loresSection = document.getElementById('lores-section') as HTMLElement;
            warscrollSection.style.display = '';
            const warscrollContainer = document.getElementById('warscrolls-list') as HTMLElement;
            const enhancementContainer = document.getElementById('enhancements-list') as HTMLElement;
            const battleContainer = document.getElementById('army-list') as HTMLElement;
            const loresContainer = document.getElementById('lores-list') as HTMLElement;

            // army abilites
            displayBattleTraits(battleContainer);

            if (roster.battleFormation) 
                displayBattleFormation(battleContainer);

            const addEnhancements = (unit: UnitInterf) => {
                const enhancements = Object.values(unit.enhancements);
                enhancements.forEach(enhance => {
                    if (enhance.slot !== null)
                        enhancementSet[enhance.id] = enhance.slot;
                });
            }

            const addUnit = (unit: UnitInterf) => {
                if (!unit)
                    return;

                if (!unitSet[unit.id])
                    unitSet[unit.id] = unit;
                addEnhancements(unit);
            }

            // units
            roster.regiments.forEach(reg => {
                if(reg.leader) {
                    addUnit(reg.leader);
                }
                reg.units.forEach(unit => {
                    addUnit(unit);
                });
            });

            roster.auxiliaryUnits.forEach(unit => {
                addUnit(unit);
            });

            if (roster.terrainFeature) {
                unitSet[roster.terrainFeature.id] = roster.terrainFeature;
            }

            if (roster.regimentOfRenown)
                displayRegimentOfRenown(unitSet, roster.regimentOfRenown, battleContainer);

            if (roster.battleTacticCards.length > 0)
                displayTactics(battleContainer);

            const units = Object.values(unitSet);
            if (units.length > 1)
                units.sort((a, b) => a.type - b.type);
            units.forEach(unit => {
                makeSelectableItem(unit, true, warscrollContainer, () => {
                    const wss = new WarscrollSettings;
                    wss.unit = unit;
                    dynamicGoTo(wss);
                });
            })

            // enhancements
            const enhancements = Object.values(enhancementSet);
            if (enhancements.length > 0) {
                enhancementSection.style.display = '';
                enhancements.forEach(enhancement => {
                    makeSelectableItem(enhancement, false, enhancementContainer, () => {
                        displayUpgradeOverlay(enhancement);
                    });
                });
            }

            // lore
            let unhideLore = false;
            if (roster.lores.spell) {
                unhideLore = true;
                displayLore('Spell', loresContainer, () => {
                    displayUpgradeOverlay(roster.lores.spell);
                });
            }

            if (roster.lores.prayer){
                unhideLore = true;
                displayLore('Prayer', loresContainer, () => {
                    displayUpgradeOverlay(roster.lores.prayer);
                });
            }

            if (roster.lores.manifestation) {
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
            await loadArmy();
            swapLayout();
            initializeDraggable('battle');
        }

        await battleLoadPage();
    }
};

dynamicPages['battle'] = battlePage;
