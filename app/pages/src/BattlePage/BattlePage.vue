<template>
    <Section title="Warscolls" v-if="units.length > 0">
        <BattleSelectableItem v-for="(unit) in units" :displayable="unit" :selectableClick="displayUnit">
        </BattleSelectableItem>
    </Section>

    <Section v-if="roster.battleTacticCards.length > 0" title="Battle Tactic Cards">
        <BattleSelectableItem v-for="(btc) in roster.battleTacticCards" :displayable="btc" :type='"Battle Tactic Card"' :selectableClick="displayTacticsOverlay">
        </BattleSelectableItem>
    </Section>

    <Section v-for="phase in phases" :title="phase">
        <DrawerSelectableItem v-for="data in Object.values(abilities[phase])" :displayable="data" :startOpen="startOpen">
            <div v-for="(ability, abIdx) in data.abilities" class="ability-section">
                <AbilityWidget  :ability="ability"></AbilityWidget>
            </div>
        </DrawerSelectableItem>
    </Section>
</template>
<!--
    <Section title="Army">
        <BattleSelectableItem :displayable="battleTrait" :type='"Battle Traits"' :selectableClick="displayUpgradeOverlay">
        </BattleSelectableItem>
        <BattleSelectableItem v-if="roster.battleFormation" :displayable="roster.battleFormation" :selectableClick="displayUpgradeOverlay">
        </BattleSelectableItem>
        <BattleSelectableItem v-for="(btc) in roster.battleTacticCards" :displayable="btc" :type='"Battle Tactic Card"' :selectableClick="displayTacticsOverlay">
        </BattleSelectableItem>
        <BattleSelectableItem v-if="roster.regimentOfRenown" :displayable="roster.regimentOfRenown" :selectableClick="displayRorOverlay">
        </BattleSelectableItem>
    </Section>
    <Section title="Enhancements" v-if="enhancements.length > 0">
        <BattleSelectableItem v-for="(enhance) in enhancements" :displayable="enhance" :selectableClick="displayUpgradeOverlay">
        </BattleSelectableItem>
    </Section>
    <Section title="Lore">
        <BattleSelectableItem v-for="(lore) in lores" :displayable="lore" :selectableClick="displayUpgradeOverlay">
        </BattleSelectableItem>
    </Section>
-->

<script setup lang="ts">
import Section from "@/lib/widgets/vue/Section.vue";
import DrawerSelectableItem from "./DrawerSelectableItem.vue";
import AbilityWidget from "./AbilityWidget.vue";
import BattleSelectableItem from "./BattleSelectableItem.vue";

import UnitInterf from "@/shared-lib/UnitInterface";
import UpgradeInterf from "@/shared-lib/UpgradeInterface";
import { displayTacticsOverlay } from "@/lib/widgets/displayTacticsOverlay";
import { displayRorOverlay, displayUpgradeOverlay } from "@/lib/widgets/displayUpgradeOverlay";
import { getPageRouter } from "@/lib/widgets/header";

import WarscrollSettings from "@/pages/src/settings/WarscrollSettings";
import LoreInterf from "@/shared-lib/LoreInterface";
import RosterInterf from "@/shared-lib/RosterInterface";
import {PhasedAbilitiesInterf} from "./PhasedAbilities";
import AppSettings from "@/lib/AppSettings";
import AbilityInterf from "@/shared-lib/AbilityInterface";

const props = defineProps<{
    units: UnitInterf[],
    battleTrait: UpgradeInterf,
    lores: LoreInterf[],
    abilities: PhasedAbilitiesInterf,
    roster: RosterInterf,
}>();

const appSettings = new AppSettings;
const startOpen = appSettings.settings()["Battle View Drawers"];

const phases = Object.getOwnPropertyNames(props.abilities).filter(name => Object.values(props.abilities[name]).length > 0);

const displayUnit = (displayedUnit: unknown) => {
    const settings = new WarscrollSettings;
    const copyObject = (obj: unknown) => JSON.parse(JSON.stringify(obj));
    const unit = copyObject(displayedUnit) as UnitInterf;

    // display enhancements on the warrscroll
    const enhancements = Object.values(unit.enhancements);
    enhancements.forEach(enhancement => {
        if (enhancement.slot) {
            enhancement.slot.abilities.forEach(ability => {
                // copy the ability to modify it
                const abilityCopy = copyObject(ability) as AbilityInterf;
                abilityCopy.name = `${abilityCopy.name} (${enhancement.name})`;
                unit.abilities.push(abilityCopy);
            });
        }
    });
    settings.unit = unit;
    getPageRouter()?.goTo(settings);
}
</script>

<style scoped>
    .ability-section {
        padding-left: .5em;
        padding-right: .5em;
        padding-bottom: .5em;
        margin: 0;
    }
    .spacer {
        height: .5em;
        padding: 0;
        margin: 0;
    }
</style>