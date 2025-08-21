<!-- src/pages/MyPage.vue -->
<template>
    <div class="selectable-item settings-item">
        <div class="settings-item-left">
            <h3 class="settings-item-name">{{ name }}</h3>
            <p class="settings-item-description">{{ description }}</p>
            <!-- selectable item type ? -->
        </div>
        <div class="settings-item-right">
            <div v-if="buttonText" class="rectangle-button" :class="buttonType" @click="buttonClick">{{ buttonText }}</div>
            <Switch v-else v-model="onOff" ></Switch>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { ref } from 'vue';
    import Switch from './Switch.vue'
    defineProps<{
        name: string,
        description: string,
        buttonText: string | undefined,
        buttonType: string | undefined,
        buttonClick: (() => void) | undefined
    }>();
    const onOff = ref(false);
</script>

<style scoped>
    @import "@/pages/css/pages.css";
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
    .delete {
        background-color: var(--red-ability);
        font-weight: bold;
        border: 1px solid var(--black-color);
    }
</style>
