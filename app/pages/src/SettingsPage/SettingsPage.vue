<!-- src/pages/MyPage.vue -->
<template>
    <Section :title="title">
        <SettingsItem name="Battle View Drawers" description="Open all the drawers in Battle View by default">
            <SettingsSwitch v-model="battleViewDrawers"></SettingsSwitch>
        </SettingsItem>
        <SettingsItem name="Display Legends" description="Allow legends units to display in the catalog. This does not currently enable legends listbuilding.">
            <SettingsSwitch v-model="displayLegends"></SettingsSwitch>
        </SettingsItem>
    </Section>
    <Section title="The Red Buttons">
        <SettingsItem name="Reset Settings" description="Return to the default settings">
            <SettingsButton buttonText="Reset" buttonType="delete" :buttonClick="resetSettings"></SettingsButton>        
        </SettingsItem>
        <SettingsItem name="Reset Page Layout" description="Return draggables to their default position">
            <SettingsButton buttonText="Reset" buttonType="delete" :buttonClick="resetPageLayout"></SettingsButton>            
        </SettingsItem>
        <SettingsItem name="Clear Favorites" description="Remove all favorites">
            <SettingsButton buttonText="Clear" buttonType="delete" :buttonClick="clearAllFavorites"></SettingsButton> 
        </SettingsItem>
        <SettingsItem name="Clear Cache" description="Delete local data cached from the server" >
            <SettingsButton buttonText="Clear" buttonType="delete" :buttonClick="clearDataCache"></SettingsButton>        
        </SettingsItem>
    </Section>
</template>

<script setup lang="ts">
    import Section from '@/lib/widgets/vue/Section.vue';
    import { initializeDraggable } from '@/lib/widgets/draggable';
    import { ref, watch } from 'vue';
    import SettingsItem from './SettingsItem.vue';
    import SettingsSwitch from './SettingsSwitch.vue';
    import SettingsButton from './SettingsButton.vue';

    import { Overlay } from '@/lib/widgets/overlay';
    import { getVar } from '@/lib/functions/getVar';
    import { clearDraggableOrder } from '@/lib/widgets/draggable';
    import { getGlobalCache } from '@/lib/RestAPI/LocalCache';
    import { clearFavorites } from '@/lib/widgets/favorites';
    import AppSettings from '@/lib/AppSettings';
import { displaySlidebanner, SlideBannerMessageType } from '@/lib/widgets/SlideBanner';
    
    // hook up the toggles to the global settings
    const appSettings = new AppSettings;

    // when i make this completely generic, vue seems unable to deduce that i made refs
    const battleViewDrawersKey = 'Battle View Drawers';
    const battleViewDrawers = ref(appSettings.settings()[battleViewDrawersKey]);
    watch(battleViewDrawers, (newValue) => {
        // update to the new value
        appSettings.settings()[battleViewDrawersKey] = newValue;
        // save for reuse
        appSettings.save();
    });

    const displayLegendsKey = 'Display Legends';
    const displayLegends = ref(appSettings.settings()[displayLegendsKey]);
    watch(displayLegends, (newValue) => {
        // update to the new value
        appSettings.settings()[displayLegendsKey] = newValue;
        // save for reuse
        appSettings.save();
    });

    const title = ref('Settings')
    initializeDraggable('Settings');

    const resetSettings = () => {
        appSettings.clear();
        battleViewDrawers.value = appSettings.settings()[battleViewDrawersKey];
        displayLegends.value = appSettings.settings()[displayLegendsKey];
        displaySlidebanner('Default settings restored', SlideBannerMessageType.Neutral);
    }

    const clearAllFavorites = () => {
        const toggle = Overlay.toggleFactory('flex', () => {
            const modal = document.querySelector(".modal") as HTMLElement;
            modal.innerHTML = '';

            const section = document.createElement('p');
            section.innerHTML = 'Do you want to clear favorites history?<br/><br/><strong>This cannot be undone.</strong>';

            const button = document.createElement('button');
            button.className = 'full-rectangle-button';
            button.textContent = 'Clear Favorites';
            button.style.backgroundColor = getVar('red-ability');
            button.style.color = getVar('black-1');
            button.style.fontWeight = 'bold';
            button.onclick = () => {
                clearFavorites();
                Overlay.disable();
                displaySlidebanner('Favorites reset.', SlideBannerMessageType.Neutral);
            };

            modal.appendChild(section);
            modal.appendChild(button);
        });
        toggle();
    }
    const resetPageLayout = () => {
        const toggle = Overlay.toggleFactory('flex', () => {
            const modal = document.querySelector(".modal") as HTMLElement;
            modal.innerHTML = '';

            const section = document.createElement('p');
            section.innerHTML = 'Reset page page layouts to their default settings?<br/><br/><strong>This cannot be undone.</strong>';

            const button = document.createElement('button');
            button.className = 'full-rectangle-button';
            button.textContent = 'Reset Layouts';
            button.style.backgroundColor = getVar('red-ability');
            button.style.color = getVar('black-1');
            button.style.fontWeight = 'bold';
            button.onclick = () => {
                clearDraggableOrder();
                Overlay.disable();
                displaySlidebanner('Page layouts reset.', SlideBannerMessageType.Neutral);
            };

            modal.appendChild(section);
            modal.appendChild(button);
        });
        toggle();
    };
    const clearDataCache = () => {
        const toggle = Overlay.toggleFactory('flex', () => {
            const modal = document.querySelector(".modal") as HTMLElement;
            modal.innerHTML = '';

            const section = document.createElement('p');
            section.innerHTML = 'Do you want to delete all data cached from the server?<br/><br/><strong>This cannot be undone.</strong>';

            const button = document.createElement('button');
            button.className = 'full-rectangle-button';
            button.textContent = 'Clear Data Cache';
            button.style.backgroundColor = getVar('red-ability');
            button.style.color = getVar('black-1');
            button.style.fontWeight = 'bold';
            button.onclick = async () => {
                getGlobalCache()?.clear();
                Overlay.disable();
                displaySlidebanner('Local data cache cleared.', SlideBannerMessageType.Neutral);
            };

            modal.appendChild(section);
            modal.appendChild(button);
        });
        toggle();
    }
</script>

<style scoped>
    @import "@/pages/css/pages.css";
</style>
