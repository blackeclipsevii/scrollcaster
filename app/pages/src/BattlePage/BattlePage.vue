<template>
    <Section title="Warscolls" v-if="units.length > 0">
        <BattleSelectableItem v-for="(unit) in units" :displayable="unit" :selectableClick="displayUnit">
        </BattleSelectableItem>
    </Section>
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
</template>

<script setup lang="ts">
import Section from "@/lib/widgets/vue/Section.vue";
import BattleSelectableItem from "./BattleSelectableItem.vue";

import UnitInterf from "@/shared-lib/UnitInterface";
import UpgradeInterf from "@/shared-lib/UpgradeInterface";
import { displayTacticsOverlay } from "@/lib/widgets/displayTacticsOverlay";
import { displayRorOverlay, displayUpgradeOverlay } from "@/lib/widgets/displayUpgradeOverlay";
import { getPageRouter } from "@/lib/widgets/header";

import WarscrollSettings from "@/pages/src/settings/WarscrollSettings";
import LoreInterf from "@/shared-lib/LoreInterface";
import RosterInterf from "@/shared-lib/RosterInterface";

defineProps<{
    units: UnitInterf[],
    enhancements: UpgradeInterf[],
    battleTrait: UpgradeInterf,
    lores: LoreInterf[],
    roster: RosterInterf
}>();    

const displayUnit = (unit: unknown) => {
    const settings = new WarscrollSettings;
    settings.unit = unit as UnitInterf;
    getPageRouter()?.goTo(settings);
}
</script>
