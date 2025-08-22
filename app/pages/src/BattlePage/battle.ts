import { hidePointsOverlay } from "@/lib/widgets/displayPointsOverlay";
import { initializeDraggable } from "@/lib/widgets/draggable";
import { disableHeaderContextMenu, getPageRouter, setHeaderTitle } from "@/lib/widgets/header";

import Settings from "@/pages/src/settings/Settings";
import BattleSettings from "@/pages/src/settings/BattleSettings"

import BattlePage from "./BattlePage.vue";
import { showVueComponent } from "../../../lib/widgets/VueApp";
import RosterInterf from "@/shared-lib/RosterInterface";
import UnitInterf from "@/shared-lib/UnitInterface";
import { getGlobalCache } from "@/lib/RestAPI/LocalCache";
import PhasedAbilities from "./PhasedAbilities";

const battlePage = {
    settings: new BattleSettings,
    async getProperties(roster: RosterInterf) {
        const traitNames = Object.getOwnPropertyNames(roster.battleTraits);
        const battleTrait = roster.battleTraits[traitNames[0]];
        const lores = [roster.lores.spell, roster.lores.prayer, roster.lores.manifestation].filter(lore => lore ? lore : null);
        const abilities = new PhasedAbilities;
        let units: UnitInterf[] = [];
        lores.forEach(lore => {
            if (lore) {
                lore.abilities.forEach(upgrade => {
                    upgrade.abilities.forEach(ability => {
                        abilities.addAbility(lore, ability); 
                    });
                });
            }
        });

        battleTrait.abilities.forEach(ability => {
            abilities.addAbility(battleTrait, ability);
        });

        if (roster.battleFormation) {
            const formation = roster.battleFormation;
            formation.abilities.forEach(ability => {
                abilities.addAbility(formation, ability);
            })
        }

        async function loadArmy() {  
            interface UnitSet {
                [name: string]: UnitInterf;
            }

            async function getManifestationUnits() {
                if (!roster.lores.manifestation) {
                    return null;
                }

                async function getSpecificUnit(id: string, useArmy: boolean): Promise<UnitInterf | null> {
                    try {
                        const units = await getGlobalCache()?.getUnits(useArmy ? roster.army : null);
                        if (!units)
                            return null;
                        return units[id];
                    } catch (error) {
                    }
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
        
            const unitSet: UnitSet = {};
            const addEnhancements = (unit: UnitInterf): void => {
                const enhancementNames: string[] = [];
                const enhancements = Object.values(unit.enhancements);
                enhancements.forEach(enhance => {
                    if (enhance.slot !== null) {
                        enhancementNames.push(enhance.name);
                    }
                });
                
                if (enhancementNames.length > 0) {
                    unit.name = `${unit.name} (${enhancementNames.join(', ')})`;
                    enhancements.forEach(enhance => {
                        if (enhance.slot !== null) {
                            enhance.slot.abilities.forEach(
                                ability => abilities.addAbility(unit, ability));
                        }
                    });
                }
            }

            const addUnit = (inUnit: UnitInterf) => {
                if (!inUnit)
                    return;

                const copyObject = (obj: unknown) => JSON.parse(JSON.stringify(obj));
                const unit = copyObject(inUnit) as UnitInterf;

                let name = unit.name;
                unit.abilities.forEach(ability => {
                    abilities.addAbility(unit, ability);
                });

                addEnhancements(unit);

                if (!unitSet[unit.name])
                    unitSet[unit.name] = unit;
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
                roster.terrainFeature.abilities.forEach(ability => {
                    abilities.addAbility(roster.terrainFeature!!, ability);
                });
                unitSet[roster.terrainFeature.id] = roster.terrainFeature;
            }

            const result = await getManifestationUnits();
            if (result) {
                for(let i = 0; i < result.units.length; ++i) {
                    addUnit(result.units[i])
                }
            }

            if (roster.regimentOfRenown) {
                const regiment = roster.regimentOfRenown;
                regiment.upgrades.forEach(upgrade => {
                    upgrade.abilities.forEach(ability => {
                        abilities.addAbility(regiment, ability);
                    });
                });

                for (let i = 0; i < regiment.unitContainers.length; ++i) {
                    const unitContainer = regiment.unitContainers[i];
                    addUnit(unitContainer.unit)
                }
            }

            units = Object.values(unitSet);
            if (units.length > 1)
                units = units.sort((a, b) => a.type - b.type);
        }
        await loadArmy();

        return {
            units: units,
            battleTrait: battleTrait,
            lores: lores,
            roster: roster,
            abilities: abilities.abilities
        };
    },
    async loadPage(settings: Settings) {
        this.settings = settings as BattleSettings;
        if (!this.settings.roster) {
            console.log ('BattleSettings must have a roster');
            return;
        }

        const properties = await this.getProperties(this.settings.roster)
        hidePointsOverlay();
        disableHeaderContextMenu();
        setHeaderTitle(`Battle View`);
        showVueComponent(BattlePage, properties);
        document.querySelectorAll('.unit-slot').forEach(wrapper => {
            const arrow = wrapper.querySelector('.arrow') as HTMLElement;
            const details = wrapper.querySelector('.unit-details') as HTMLElement;

            const isOpen = details.classList.contains('open');

            if (isOpen) {
                details.style.maxHeight = details.scrollHeight + "px";
                arrow.style.transform = 'rotate(90deg)';
            } else {
                details.style.maxHeight = '';
                arrow.style.transform = 'rotate(0deg)';
            }
        });

        initializeDraggable('battle');
    }
};

export const registerBattlePage = () => {
    getPageRouter()?.registerPage('battle', battlePage);
}