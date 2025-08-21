<!-- src/pages/MyPage.vue -->
<template>
    <div class="section draggable">
        <div class="draggable-grip">
            <span class="grip-icon">⋮⋮⋮</span>
            <h3 class="section-title">{{ title }}</h3>
        </div>
        <div class="item-list" id="settings-list">
            <SettingsItem name="Legends" description="Allow legends units to display in the catalog."></SettingsItem>
            <SettingsItem name="Reset Page Layout" description="Return draggables to their default position" 
                          buttonText="Reset" buttonType="delete"
                          :buttonClick="resetPageLayout"></SettingsItem>
            <SettingsItem name="Clear Favorites" description="Remove all favorites" 
                          buttonText="Clear" buttonType="delete"
                          :buttonClick="clearAllFavorites"></SettingsItem>
            <SettingsItem name="Clear Cache" description="Delete local data cached from the server" 
                          button-Text="Clear" buttonType="delete"
                          :buttonClick="clearDataCache"></SettingsItem>
        </div>
    </div>
</template>

<script setup lang="ts">
    import { initializeDraggable } from '@/lib/widgets/draggable';
    import { ref } from 'vue';
    import SettingsItem from './SettingsItem.vue';
    import { Overlay } from '@/lib/widgets/overlay';
    import { getVar } from '@/lib/functions/getVar';
    import { clearDraggableOrder } from '@/lib/widgets/draggable';
    import { getGlobalCache } from '@/lib/RestAPI/LocalCache';
import { clearFavorites } from '@/lib/widgets/favorites';
    
    const title = ref('Settings')
    initializeDraggable('Settings');

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
