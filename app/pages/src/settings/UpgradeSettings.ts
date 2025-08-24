import Settings from "./Settings";
import RosterInterf from "@scrollcaster/shared-lib/RosterInterface";

export default class UpgradeSettings implements Settings {
    [name: string]: unknown;
    titleName = null as string | null;
    type = null as string | null;
    roster = null as RosterInterf | null;
    armyName = null as string | null;

    isLore() {
        return this.type && this.type.toLowerCase().includes('lore')
    }
    
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Upgrade';
    }

    toUrl() {
        let url = `${window.location.origin}?page=${this.pageName()}`;
        if (this.titleName)
            url += `&titleName=${this.titleName}`;
        if (this.type)
            url += `&type=${this.type}`;
        if (this.roster)
            url += `&roster=${this.roster.id}`;
        if (this.armyName)
            url += `&armyName=${this.armyName}`;
        return encodeURI(url);
    }
}