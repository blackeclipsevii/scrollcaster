import { registerCatalogPage } from "./tome.js";
import { registerRostersPage } from "./rosters.js";
import { registerSearchPage } from "./search.js";
import { registerTacticsPage } from "./tactics.js";
import { registerUpgradesPage } from "./upgrades.js";
import { registerUnitsPage } from "./units.js";
import { registerWarscrollPage } from "./warscroll.js";
import { registerBuilderPage } from "./builder.js";
import { registerBattlePage } from "./battle.js";
import { registerRegimentOfRenownPage } from "./regimentOfRenown.js";
import Settings from "./settings/Settings.js";
import { getPageRouter } from "../../lib/widgets/header.js";

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
    if (initialSettings) {
        getPageRouter()?.goTo(initialSettings);
    }
}