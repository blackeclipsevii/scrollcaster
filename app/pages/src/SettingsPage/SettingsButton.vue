<!-- src/pages/MyPage.vue -->
<template>
    <div class="rectangle-button" :class="buttonType" @click="buttonClick">{{ buttonText }}</div>
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
    .delete {
        background-color: var(--red-ability);
        font-weight: bold;
        border: 1px solid var(--black-color);
    }
</style>
