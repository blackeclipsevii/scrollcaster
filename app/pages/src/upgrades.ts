import { ArmyUpgrades } from "@/shared-lib/ArmyUpgrades";
import RosterInterf from "@/shared-lib/RosterInterface";
import UpgradeInterf, { UpgradeLUT, UpgradeType, upgradeTypeToString } from "@/shared-lib/UpgradeInterface";
import { displayPoints } from "@/lib/host";
import { fetchWithLoadingDisplay } from "@/lib/RestAPI/fetchWithLoadingDisplay";
import { displayPointsOverlay, hidePointsOverlay } from "@/lib/widgets/displayPointsOverlay";
import { displayUpgradeOverlay } from "@/lib/widgets/displayUpgradeOverlay";
import { initializeDraggable } from "@/lib/widgets/draggable";
import { initializeFavoritesList, newFavoritesCheckbox, newFavoritesOnChange } from "@/lib/widgets/favorites";
import { disableHeaderContextMenu, getPageRouter, setHeaderTitle } from "@/lib/widgets/header";
import { makeSelectableItemName, makeSelectableItemType } from "@/lib/widgets/helpers";
import { layoutDefaultFactory, makeLayout, swapLayout } from "@/lib/widgets/layout";
import { endpoint } from "@/lib/endpoint";
import LoreInterf, { LoreLUTInterf } from "@/shared-lib/LoreInterface";
import { putRoster } from "@/lib/RestAPI/roster";
import { getGlobalCache } from "@/lib/RestAPI/LocalCache";

import Settings from "./settings/Settings";
import UpgradeSettings from "./settings/UpgradeSettings";

const upgradePage = {
    settings: new UpgradeSettings,
    loadPage(settings: Settings) {
        const thisPage = this;
        
        if (!settings)
            settings = new UpgradeSettings;

        thisPage.settings = settings as UpgradeSettings;
        const roster = thisPage.settings.roster;

        const isUniversal = (str: string) => {
            return str.startsWith("UNIVERSAL-");
        }
        
        function displayUpgrade(upgrade: UpgradeInterf | LoreInterf) {
            let typeName = 'Upgrade';
            if ((upgrade as UpgradeInterf).typeName) 
                typeName = (upgrade as UpgradeInterf).typeName;
            else if (upgrade.type !== undefined) {
                typeName = upgradeTypeToString(upgrade.type);
            }
            const adjustedName = typeName.toLowerCase().replace(/ /g, '-');
            let section = document.getElementById(`${adjustedName}-section`);
            if (!section) {
                const main = document.getElementById('loading-content') as HTMLElement;
                section = layoutDefaultFactory(main, typeName);
            }
            let upgradeList = section.querySelector('.item-list') as HTMLElement;
        
            section.style.display = 'block';
        
            const item = document.createElement('div');
            item.classList.add('selectable-item');
            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                displayUpgradeOverlay(upgrade);
            });
            
            if (roster && !getPageRouter()?.inCatalog()) {
                item.classList.add('not-added');
            }
        
            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            
            const nameEle = makeSelectableItemName(upgrade);
            left.appendChild(nameEle);

            const typeEle = makeSelectableItemType(upgrade);
            left.appendChild(typeEle);
        
            const right = document.createElement('div');
            right.classList.add('selectable-item-right');
        
            const points = document.createElement('span');
            points.className = 'points-label';
            displayPoints(points, upgrade.points);
            
            let heart = null;
            let heartOnChange = null;
            if (roster) {
                const checkbox = document.createElement('input');
                checkbox.classList.add('upgrade-checkbox');
                checkbox.type = "radio";
                checkbox.name = `${upgrade.type}`;
                checkbox.style.transform = 'scale(1.5)';

                checkbox.onclick = (e) =>{
                    e.stopPropagation();
                }
    
                //checkbox.textContent = '+';
                checkbox.addEventListener('change', async (e: Event) => {
                    e.stopPropagation(); // Prevents click from triggering page change
                    
                    const type = thisPage.settings.type;
                    if ((e.target as HTMLInputElement).checked) {
                        const allSelectables = section.querySelectorAll('.selectable-item');
                        allSelectables.forEach(selectable => {
                            if (!selectable.classList.contains('not-added')) {
                                selectable.classList.add('not-added');
                                selectable.classList.remove('added');
                            }
                        });
                        item.classList.remove('not-added');
                        item.classList.add('added');
                        if (type) {
                            if (type.includes('battleFormation')) {
                                roster.battleFormation = upgrade as UpgradeInterf;
                            } else if (upgrade.type === UpgradeType.SpellLore) {
                                roster.lores.spell = upgrade as LoreInterf;   
                            } else if (upgrade.type === UpgradeType.ManifestationLore) {
                                roster.lores.manifestation = upgrade as LoreInterf;
                            } else if (upgrade.type === UpgradeType.PrayerLore) {
                                roster.lores.prayer = upgrade as LoreInterf;
                            }
                        }
                    }
                    await putRoster(roster);
                });

                const doEnable = () => {
                    checkbox.checked = true;
                    item.classList.remove('not-added');
                    item.classList.add('added');
                }

                if (upgrade.type === UpgradeType.SpellLore && roster.lores.spell) {
                    if (upgrade.id.localeCompare(roster.lores.spell.id) === 0) {
                        doEnable();
                    }
                } 
                else if (upgrade.type === UpgradeType.ManifestationLore && roster.lores.manifestation) {
                    if (upgrade.id.localeCompare(roster.lores.manifestation.id) === 0) {
                        doEnable();
                    }
                }
                else if (upgrade.type === UpgradeType.PrayerLore && roster.lores.prayer) {
                    if (upgrade.id.localeCompare(roster.lores.prayer.id) === 0) {
                        doEnable();
                    }
                }
                else if (roster.battleFormation) {
                    if (upgrade.id.localeCompare(roster.battleFormation.id) === 0) {
                        doEnable();
                    }
                }
        
                right.append(points, checkbox);
            } else {
                // to-do this being a radio makes favorites weird
                heartOnChange = newFavoritesOnChange(upgradeList, item, upgrade.name);
                // battle formation doesn't have id?
                heart = newFavoritesCheckbox(upgrade.id, 'upgrade', heartOnChange);
                right.append(heart, points);
            }
            item.append(left, right);
            upgradeList.appendChild(item);
            
            if (heart && heart.checked && heartOnChange)
                heartOnChange(true, upgrade.id, 'upgrade');
        }
        
        function displayUpgrades(upgradeList: UpgradeLUT[] | LoreLUTInterf[]) {
            upgradeList.forEach(upgrades => {
                if (!upgrades)
                    return;
        
                let upgradeNames = Object.getOwnPropertyNames(upgrades);
                if (thisPage.settings && thisPage.settings.isLore()) {
                    if (thisPage.settings.roster) {
                        if (upgradeNames.length > 1) {
                            upgradeNames = upgradeNames
                                            .sort((a, b) => {
                                                // Prioritize non-UNIVERSAL strings
                                                const aIsUniversal = isUniversal(a);
                                                if (aIsUniversal !== isUniversal(b)) {
                                                    return aIsUniversal ? 1 : -1;
                                                }
                                                // Sort alphabetically within each group
                                                return a.localeCompare(b);
                                            });
                        }
                    } else if (thisPage.settings.armyName) {
                        upgradeNames = upgradeNames.filter(name => !isUniversal(name));
                    }
                }
                upgradeNames.forEach(upgradeName => {
                    const upgrade = upgrades[upgradeName];
                    displayUpgrade(upgrade);
                });
            });
        }
        
        async function loadUniversalLores() {
            setHeaderTitle('Universal Manifestation Lores');
            hidePointsOverlay();
            await fetchWithLoadingDisplay(encodeURI(`${endpoint}/lores`),
            uk => {
                const loreObject = uk as {
                    lores: {manifestation: LoreLUTInterf},
                    universal: {id: string, points: number, type: number}[]
                };
                
                loreObject.universal.forEach(ulut => {
                    const lore = loreObject.lores.manifestation[ulut.id];
                    displayUpgrade(lore);
                });
            });
        }

        const filterUpgrades = (allUpgrades: ArmyUpgrades) => {
            if (thisPage.settings && thisPage.settings.isLore()) {
                const upgradeList: LoreLUTInterf[] = [];
                const loreNames = Object.getOwnPropertyNames(allUpgrades.lores);
                loreNames.forEach(loreName => {
                    upgradeList.push(allUpgrades.lores[loreName]);
                });
                return upgradeList;
            }

            if (thisPage.settings.type === null)
                return [] as UpgradeLUT[];

            if (!allUpgrades[thisPage.settings.type]) {
                const tmp = allUpgrades.enhancements[thisPage.settings.type];
                if (tmp) {
                    return [tmp.upgrades];
                } else {
                    return [] as UpgradeLUT[]
                }
            }

            const upgradeList: UpgradeLUT[] = [allUpgrades[thisPage.settings.type] as UpgradeLUT];
            return upgradeList;
        }
        
        async function loadUpgradesCatalog(armyName: string) {
            if (thisPage.settings.titleName)
                setHeaderTitle(thisPage.settings.titleName);
            else
                setHeaderTitle('Upgrades');
            hidePointsOverlay();
            const allUpgrades = await getGlobalCache()?.getUpgrades(armyName);
            if (!allUpgrades)
                return;

            const upgradeList = filterUpgrades(allUpgrades);
            displayUpgrades(upgradeList);
        }
        
        async function loadUpgrades(roster: RosterInterf) {
            if (thisPage.settings.titleName)
                setHeaderTitle(thisPage.settings.titleName);
            else
                setHeaderTitle('Upgrades');

            displayPointsOverlay(roster);
        
            const allUpgrades = await getGlobalCache()?.getUpgrades(roster.army);
            if (!allUpgrades)
                return;

            const upgradeList = filterUpgrades(allUpgrades);
            displayUpgrades(upgradeList);
        }
        
        const loadUpgradesPage = async () => {
            makeLayout([]);
            initializeFavoritesList();
            disableHeaderContextMenu();
            if (thisPage.settings.roster)
                await loadUpgrades(thisPage.settings.roster);
            else if (thisPage.settings.armyName)
                await loadUpgradesCatalog(thisPage.settings.armyName);
            else
                await loadUniversalLores();
            
            const manLoreSect = document.getElementById('manifestation-lore-section');
            if (manLoreSect && manLoreSect.parentElement) {
                manLoreSect.parentElement.appendChild(manLoreSect);
            }

            swapLayout();
            if (thisPage.settings.roster) {
                // leave room for the overlay
                const ele = document.querySelector('.main');
                if (ele)
                    ele.classList.add('main-extended');
            }
            initializeDraggable('upgrades');
        }
        
        loadUpgradesPage();
    }
}

export const registerUpgradesPage = () => {
    getPageRouter()?.registerPage('upgrades', upgradePage);
}