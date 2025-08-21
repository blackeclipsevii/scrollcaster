<!-- src/pages/MyPage.vue -->
<template>
    <div class="selectable-item settings-item">
        <div class="settings-item-left">
            <h4 class="settings-item-name">{{ name }}</h4>
            <p class="settings-item-description">{{ description }}</p>
            <!-- selectable item type ? -->
        </div>
        <div class="settings-item-right">
            <slot></slot>
        </div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{
        name: string,
        description: string
    }>();
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
