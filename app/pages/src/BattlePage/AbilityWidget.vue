<template>
    <div :style="{ backgroundColor: color, borderColor: color }" class='ability-container'>
        <div :style="{ color: headerFontColor }" class='ability-header'>
            <div class="ability-icon-wrapper">
                <img :class='"ability-icon " + invertClass' :src="abIcon"></img>
            </div>
            <h3 v-html="ability.timing"></h3>
        </div>
        <div class="ability-body">
            <h3 class="abilityname" v-html="ability.name"></h3>
            <p v-if="ability.cost > 0" class="abilitycost" v-html="costText"></p>
            <p v-if="ability.declare.length > 0" class="abilitydeclare" v-html="declareText"></p>
            <p v-if="ability.effect.length > 0" class="abilityeffect" v-html="effectText"></p>
            <h5 v-if="ability.keywords.length > 0" class="abilitykeywords" v-html="keywordsText"></h5>
        </div>
    </div>
</template>

<script setup lang="ts">
import { getVar } from "@/lib/functions/getVar";
import { abOffensive } from "@/lib/widgets/images";
import { abRallying } from "@/lib/widgets/images";
import { abControl } from "@/lib/widgets/images";
import { abMovement } from "@/lib/widgets/images";
import { abSpecial } from "@/lib/widgets/images";
import { abShooting } from "@/lib/widgets/images";
import { abDefensive } from "@/lib/widgets/images";
import { abDamage } from "@/lib/widgets/images";
import AbilityInterf, { AbilityType } from "@/shared-lib/AbilityInterface";

const abilityIconLut: {[name: string]: string} = {
    'ab-offensive': abOffensive,
    'ab-rallying': abRallying,
    'ab-control': abControl,
    'ab-movement': abMovement,
    'ab-special': abSpecial,
    'ab-shooting': abShooting,
    'ab-defensive': abDefensive,
    'ab-damage': abDamage,
}

const props = defineProps<{
    ability: AbilityInterf
}>(); 

const abilityColor = props.ability.color.toLowerCase();
let theColor = getVar(`${abilityColor}-ability`);
let color = getVar('gray-ability');
if (theColor && theColor.length > 0)
    color = theColor;

theColor = getVar(`${abilityColor}-ability-header-font-color`);
let headerFontColor = getVar('header-font-color');
if (theColor && theColor.length > 0)
    headerFontColor = theColor;

let type = props.ability.abilityType;
let abIcon = abilityIconLut[`ab-${type.toLowerCase()}`];

const invertClass = getVar(`${abilityColor}-invert-png`) ? '' : 'invert-img';

let costText = '<b>Cost:</b>'
if (props.ability.type === AbilityType.Spell) {
    costText = '<b>Casting Value:</b>';
} else if (props.ability.type === AbilityType.Prayer) {
    costText = '<b>Chanting Value:</b>';
}
costText = `${costText} ${props.ability.cost.toString()}`

const declareText = `<b>Declare: </b>${props.ability.declare}`;
const effectText = `<b>Effect: </b>${props.ability.effect}`;
const keywordsText = `<b>Keywords: </b>${props.ability.keywords}`;
</script>

<style scoped>
    @import "@/lib/lib.css";
    h3 {
        margin: .25em;
    }
    p {
        margin-bottom: 0;
    }
    .abilityname {
        margin: 0;
        color: var(--white-2);
    }
    .ability-header {
        display: flex;
        align-content: center;
    }
    .ability-icon-wrapper {
        display: flex;
        align-items: center;
        width: 2em;
        height: 2em;
    }
    .ability-icon {
        margin: 0;
    }
    .ability-container {
        width: calc(100% - 2px);
        margin: 0;
    }
</style>