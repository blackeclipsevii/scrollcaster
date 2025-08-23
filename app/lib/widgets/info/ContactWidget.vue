<template>
    <div class="contact">
        <a target="_blank" :href="href">
            <img class='my-icon' :src=icon></img>
        </a>
        
        <a target="_blank" :href="href">
        <div class="text-bits">
            <h3>{{ largeText }}</h3>
            <h5>{{ smallText }}</h5>
        </div>
        </a>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    href: string,
    icon: string,
    largeText: string,
    smallText: string
}>();
</script>

<style>
    .contact {
        display: flex;
        gap: 1em;
        justify-content: center;
        align-items: center;
    }
    .my-icon {
        border-radius: var(--border-radius);
        width: 3em;
        height: 3em;
        border-radius: 50%;
        border: 4px solid var(--black-3);
    }
    .text-bits {
        height: 3em;
    }
    a {
        height: 3em;
        text-decoration: none;
        color: inherit;
    }
    h3 {
        padding: 0px;
        margin: 0;
        margin-bottom: 4px;
    }
    h5 {
        margin: 0;
        color: var(--white-3);
    }
</style>