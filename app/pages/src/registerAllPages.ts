import { registerCatalogPage } from "./tome";
import { registerRostersPage } from "./rosters";
import { registerSearchPage } from "./search";
import { registerTacticsPage } from "./tactics";
import { registerUpgradesPage } from "./upgrades";
import { registerUnitsPage } from "./units";
import { registerWarscrollPage } from "./warscroll";
import { registerBuilderPage } from "./builder";
import { registerBattlePage } from "./battle";
import { registerRegimentOfRenownPage } from "./regimentOfRenown";
import Settings from "./settings/Settings";
import { getPageRouter } from "@/lib/widgets/header";

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