
import Settings from "./settings/Settings";
import { registerCatalogPage } from "./tome";
import { registerRostersPage } from "./rosters";
import { registerSearchPage } from "./search";
import { registerTacticsPage } from "./tactics";
import { registerUpgradesPage } from "./upgrades";
import { registerUnitsPage } from "./units";
import { registerWarscrollPage } from "./warscroll";
import { registerBuilderPage } from "./builder";
import { registerBattlePage } from "./BattlePage/battle";
import { registerRegimentOfRenownPage } from "./regimentOfRenown";
import { getPageRouter } from "@/lib/widgets/header";
import { registerSettingsPage } from "./SettingsPage/SettingsPageWrapper";

export const registerAllPages = (initialSettings ?: Settings) => {
    registerRostersPage();
    registerCatalogPage();
    registerSearchPage();
    registerTacticsPage();
    registerUnitsPage();
    registerUpgradesPage();
    registerWarscrollPage();
    registerBuilderPage();
    registerBattlePage();
    registerRegimentOfRenownPage();
    registerSettingsPage();
    if (initialSettings) {
        getPageRouter()?.goTo(initialSettings);
    }
}