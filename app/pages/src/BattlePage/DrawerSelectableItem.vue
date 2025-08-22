<template>
    <div class="unit-slot">
        <div class='unit-slot-display-wrapper'>
            <div class='arrow-wrapper' @click="arrowOnClick">
                <div class='arrow'>
                    <img class='invert-img' :src="rightArrow"></img>
                </div>
            </div>

            <div class='unit-slot-selectable-item-wrapper'>
                <BattleSelectableItem :displayable="displayable" :type="type" :selectableClick="selectableClick"></BattleSelectableItem>
            </div>
        </div>
        <div :class='"unit-details " + openClass'>
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
import { rightArrow } from '@/lib/widgets/images';
import BattleSelectableItem from './BattleSelectableItem.vue';

const props = defineProps<{
    selectableClick ?: (displayable: unknown) => void,
    displayable: {name: string, type?: number, armyName?: string},
    type ?: string,
    startOpen ?: boolean
}>();

let openClass = props.startOpen ? 'open' : '';

const arrowOnClick = (event: Event) => {
    const element = event.target as HTMLElement;
    const wrapper = element.closest('.unit-slot') as HTMLElement;
    const arrow = wrapper.querySelector('.arrow') as HTMLElement;
    const details = wrapper.querySelector('.unit-details') as HTMLElement;

    const isOpen = details.classList.toggle('open');

    if (!isOpen) {
        details.style.maxHeight = '';
        arrow.style.transform = 'rotate(0deg)';
    } else {
        details.style.maxHeight = details.scrollHeight + "px";
        arrow.style.transform = 'rotate(90deg)';
    }
}

</script>

<style scoped>
    @import "@/lib/lib.css";
    @import "@/pages/css/pages.css";
    .selectable-item {
        border: none;
    }
    .upgrade-section {
        margin: .5em;
    }
</style>