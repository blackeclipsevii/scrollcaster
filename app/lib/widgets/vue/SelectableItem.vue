<template>
    <div class="selectable-item" @click="selectableClick">
        <div class="selectable-item-left">
            <slot name="left"></slot>
        </div>
        <div class="selectable-item-right">
            <slot name="right"></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{
        selectableClick: () => void,
    }>();    
</script>

<style scoped>
    @import "@/pages/css/pages.css";
</style>
