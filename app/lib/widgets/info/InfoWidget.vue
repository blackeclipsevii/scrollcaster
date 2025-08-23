<template>
    <div class="section iw-section">
    <div class="title">
        <img class='scrollcaster-icon' :src=scrollcasterIcon></img>
        <div class="info-block">
            <h1>Scrollcaster</h1>
            <h3 class="release-notes-title">{{ version }}</h3>
            <h5 class="release-notes-description">{{ description }}</h5>
        </div>
    </div>
    </div>
    <ul>
        <li v-for="(item, index) in bulletPoints" :key="index">
            {{ item }}
        </li>
    </ul>
    <div class='section iw-section'>
    <h4 style="margin: 0;">Have ideas or need support?</h4>
    <div class="contact-section">
        <ContactWidget :icon="redditIcon" href="https://www.reddit.com/user/joe-scrollcaster"
                       largeText="Reddit" smallText="u/joe-scrollcaster">
        </ContactWidget>
        <ContactWidget :icon="githubIcon" href="https://github.com/blackeclipsevii/scrollcaster"
                       largeText="GitHub" smallText="scrollcaster">
        </ContactWidget>
    </div>
    </div>
</template>

<script setup lang="ts">
import { githubIcon, redditIcon, scrollcasterIcon } from '../images';
import ContactWidget from './ContactWidget.vue';
defineProps<{
    version: string,
    description: string,
    bulletPoints: string[]
}>();
</script>

<style scoped>
    .contact-section,
    .title {
        display: flex;
        gap: .5em;
        justify-content: center;
        align-items: center;
    }
    .scrollcaster-icon {
        border-radius: var(--border-radius);
        width: 6em;
        height: 6em;
        border: 4px solid var(--black-3);
    }
    .contact-section {
        height: fit-content;
    }
    .info-block {
        height: 6em;
    }
    h1 {
        margin: 0;
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
    .iw-section {
        background-color: var(--black-1);
        padding: .5em;
        margin: 0;
    }
</style>