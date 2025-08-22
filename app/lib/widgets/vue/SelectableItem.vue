<template>
    <div class="selectable-item" @click="selectableClick">
        <div :class="['selectable-item-left', { 'single-slot': !hasSecondSlot }]">
            <slot name="left"></slot>
        </div>
        <div class="selectable-item-right">
            <slot name="right"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{
        selectableClick: () => void
    }>();
</script>
<script lang="ts">
    export default {
        computed: {
            hasSecondSlot() {
                return !!this.$slots.right;
            }
        }
    }
</script>
<style scoped>
    @import "@/pages/css/pages.css";
    .single-slot {
        max-width: 100%;
    }
</style>
