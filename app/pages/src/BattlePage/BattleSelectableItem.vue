
<template>
    <SelectableItem :selectableClick="doClick">
        <template #left>
            <h4 class="settings-item-name">{{ displayable.name }}</h4>
            <span class='selectable-item-type ability-label'>{{ type }}</span>
            <span v-if='displayable.armyName' class='selectable-item-type ability-label'>{{ displayable.armyName }}</span>
        </template>
    </SelectableItem>
</template>

<script setup lang="ts">
    // if we cant use this function, just set to unknown
    import { getSelectableItemType } from '@/lib/widgets/helpers';
    import SelectableItem from '@/lib/widgets/vue/SelectableItem.vue';

    const props = defineProps<{
        displayable: {name: string, type?: number, armyName?: string},
        type ?: string,
        selectableClick ?: (displayedObject: unknown) => void
    }>();  

    const doClick = () =>{
        if (props.selectableClick)
            props.selectableClick(props.displayable);
    }

    // this is a hack that should be removed
    let type: string = 'Unknown';
    if (props.type !== undefined)
        type = props.type;
    else if (props.displayable && props.displayable.type !== undefined)
        type = getSelectableItemType(props.displayable as {type:number, typeName?:string});
</script>

<style scoped>
    @import "@/pages/css/pages.css";
    h4 {
        margin: 0px;
    }
    p {
      margin: 0em;
      margin-top: .5em;
      font-size: 14px;
    }
    .settings-item {
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .settings-item-right {
        margin-left: auto;
    }
    .settings-item-description {
        color: var(--white-2);
    }
</style>
