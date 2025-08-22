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
            <p v-if="cost" class="abilitycost" v-html="costText"></p>
            <p v-if="lookableAbility['declare']" class="abilitydeclare" v-html="declareText"></p>
            <p v-if="lookableAbility['effect']" class="abilityeffect" v-html="effectText"></p>
            <h5 v-if="lookableAbility['keywords']" class="abilitykeywords" v-html="keywordsText"></h5>
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
import AbilityInterf from "@/shared-lib/AbilityInterface";

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

let cssColor = 'gray';
if (props.ability.metadata && props.ability.metadata.color) {
    cssColor = props.ability.metadata.color.toLowerCase();
}

let theColor = getVar(`${cssColor}-ability`);
let color = getVar('gray-ability');
if (theColor && theColor.length > 0)
    color = theColor;

theColor = getVar(`${cssColor}-ability-header-font-color`);
let headerFontColor = getVar('header-font-color');
if (theColor && theColor.length > 0)
    headerFontColor = theColor;

let abIcon = abilityIconLut['ab-special'];
if (props.ability.metadata && props.ability.metadata.type) {
    let type = props.ability.metadata.type;
    abIcon = abilityIconLut[`ab-${type.toLowerCase()}`];
}

const invertClass = getVar(`${cssColor}-invert-png`) ? '' : 'invert-img';

const lookableAbility = props.ability as unknown as {[name: string]: string};
let cost: string | undefined;
let costText = '<b>Cost:</b>'
if (lookableAbility['casting value']) {
    costText = '<b>Casting Value:</b>';
    cost = lookableAbility['casting value'];
} else if (lookableAbility['chanting value']) {
    costText = '<b>Chanting Value:</b>';
    cost = lookableAbility['chanting value'];
} else {
    cost = lookableAbility['cost'];
}
if (cost !== undefined && cost !== null)
    costText = `${costText} ${cost.toString()}`

const declareText = `<b>Declare: </b>${lookableAbility['declare']}`;
const effectText = `<b>Effect: </b>${lookableAbility['effect']}`;
const keywordsText = `<b>Keywords: </b>${lookableAbility['keywords']}`;
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