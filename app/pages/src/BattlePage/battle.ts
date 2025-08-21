import { hidePointsOverlay } from "@/lib/widgets/displayPointsOverlay";
import { initializeDraggable } from "@/lib/widgets/draggable";
import { disableHeaderContextMenu, getPageRouter, setHeaderTitle } from "@/lib/widgets/header";

import Settings from "@/pages/src/settings/Settings";
import BattleSettings from "@/pages/src/settings/BattleSettings"

import BattlePage from "./BattlePage.vue";
import { showVueComponent } from "../VueApp";
import RosterInterf from "@/shared-lib/RosterInterface";
import UnitInterf from "@/shared-lib/UnitInterface";
import UpgradeInterf from "@/shared-lib/UpgradeInterface";
import { getGlobalCache } from "@/lib/RestAPI/LocalCache";
import { Force } from "@/shared-lib/Force";

const battlePage = {
    settings: new BattleSettings,
    async getProperties(roster: RosterInterf) {
        const traitNames = Object.getOwnPropertyNames(roster.battleTraits);
        const battleTrait = roster.battleTraits[traitNames[0]];
        const lores = [roster.lores.spell, roster.lores.prayer, roster.lores.manifestation].filter(lore => lore ? lore : null);

        let units: UnitInterf[] = [];
        let enhancements: UpgradeInterf[] = [];

        async function loadArmy() {  
            interface UnitSet {
                [name: string]: UnitInterf;
            }

            interface UpgradeSet {
                [name: string]: UpgradeInterf;
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
            const enhancementSet: UpgradeSet = {};

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

            const result = await getManifestationUnits();
            if (result) {
                for(let i = 0; i < result.units.length; ++i) {
                    const unit = result.units[i];
                    unitSet[unit.id] = unit;
                }
            }

            function gatherRorUnits(regiment: Force) {
                for (let i = 0; i < regiment.unitContainers.length; ++i) {
                    const unitContainer = regiment.unitContainers[i];
                    if (!unitSet[unitContainer.unit.id]) {
                        unitSet[unitContainer.unit.id] = unitContainer.unit;
                    }
                }
            }

            if (roster.regimentOfRenown)
                gatherRorUnits(roster.regimentOfRenown);

            units = Object.values(unitSet);
            if (units.length > 1)
                units = units.sort((a, b) => a.type - b.type);

            // enhancements
            enhancements = Object.values(enhancementSet);
        }
        await loadArmy();

        return {
            units: units,
            enhancements: enhancements,
            battleTrait: battleTrait,
            lores: lores,
            roster: roster
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
        initializeDraggable('battle');
    }
};

export const registerBattlePage = () => {
    getPageRouter()?.registerPage('battle', battlePage);
}