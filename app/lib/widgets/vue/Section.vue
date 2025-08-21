<template>
    <div class="section draggable">
        <div class="draggable-grip">
            <span class="grip-icon">⋮⋮⋮</span>
            <h3 class="section-title">{{ title }}</h3>
        </div>
        <div class="item-list">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{
        title: string,
    }>();    
</script>

<style scoped>
    @import "@/pages/css/pages.css";
</style>
