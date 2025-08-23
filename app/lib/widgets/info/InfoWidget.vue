<template>
    <div class="section">
    <div class="title">
        <img class='scrollcaster-icon' :src=scrollcasterIcon></img>
        <div class="info-block">
            <h1>Scrollcaster</h1>
            <h3 class="release-notes-title">{{ version }} Release Notes</h3>
            <h5 class="release-notes-description">{{ description }}</h5>
        </div>
    </div>
    </div>
    <ul>
        <li v-for="(item, index) in bulletPoints" :key="index">
            {{ item }}
        </li>
    </ul>
    <div class='section contact-section'>
    <h3 style="margin-top: 0; margin-bottom: .5em;">Have ideas or need support?</h3>
    <div class="contact">
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

<style>
    .contact,
    .title {
        display: flex;
        gap: 1em;
        justify-content: center;
        align-items: center;
    }
    .reddit-icon,
    .scrollcaster-icon {
        border-radius: var(--border-radius);
        width: 6em;
        height: 6em;
        border: 4px solid var(--black-3);
    }
    .reddit-icon {
        width: 3em;
        height: 3em;
        border-radius: 50%;
        border: 4px solid var(--black-3);
    }
    .info-block {
        height: 6em;
    }
    .reddit-bits {
        height: 3em;
    }
    h1 {
        margin: 0;
    }
    a {
        height:fit-content;
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
    .section {
        background-color: var(--black-1);
        padding: 1em;
    }
</style>