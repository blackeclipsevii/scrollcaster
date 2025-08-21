import { hidePointsOverlay } from "@/lib/widgets/displayPointsOverlay";
import { initializeDraggable } from "@/lib/widgets/draggable";
import { disableHeaderContextMenu, enableBackButton, getPageRouter, setHeaderTitle } from "@/lib/widgets/header";

import Settings from "@/pages/src/settings/Settings";

import { showVueComponent } from "../../../lib/widgets/VueApp";
import SettingsSettings from "../settings/SettingsSettings";
import SettingsPage from "./SettingsPage.vue";

const settingsPage = {
    settings: new SettingsSettings,
    async loadPage(settings: Settings) {
        this.settings = settings as SettingsSettings;
        hidePointsOverlay();
        disableHeaderContextMenu();
        enableBackButton();
        setHeaderTitle(`Settings`);
        showVueComponent(SettingsPage);
        initializeDraggable('battle');
    }
};

export const registerSettingsPage = () => {
    getPageRouter()?.registerPage('settings', settingsPage);
}