<!-- src/pages/MyPage.vue -->
<template>
    <div class="rectangle-button-wrapper">
        <div class="rectangle-button" :class="buttonType" @click="buttonClick">{{ buttonText }}</div>
    </div>
</template>

<script setup lang="ts">
    defineProps<{
        buttonText: string,
        buttonType: string,
        buttonClick: (() => void)
    }>();
</script>

<style scoped>
    @import "@/pages/css/pages.css";
    .rectangle-button-wrapper {
        display: flex;
        justify-content: center;
        width: 5em;
    }
    .div {
        width: 100%;
        height: 100%;
    }
    .delete {
        background-color: var(--red-ability);
        font-weight: bold;
        border: 1px solid var(--black-color);
    }
</style>
