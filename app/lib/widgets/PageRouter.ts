import CatalogSettings from "../../pages/src/settings/CatalogSettings.js";
import RostersSettings from "../../pages/src/settings/RostersSettings.js";
import Settings from "../../pages/src/settings/Settings.js";
import { ContextMenu } from "./contextMenu.js";
import { Overlay } from "./overlay.js";

interface HistoryEle {
    scrollY: number;
    settings: Settings;
}

class HistoryStack {
    currentSettings: Settings | null = null;
    history: HistoryEle[] = [];
}

interface LinkStack {
    catalog: HistoryStack,
    roster: HistoryStack
}

export interface Page {
  settings: Settings | null;
  loadPage: ((settings: Settings) => void);
}

interface DynamicPages {
  [name: string]: Page
}

// this object shouldn't need this
const enableHeaderBackButton = () => {
    const hdr = document.querySelector('header');
    if (hdr) {
        const left = hdr.querySelector('.header-left') as HTMLElement | null;
        if (left) {
            left.style.display = '';
        }
    }
}

export enum ViewType {
    Catalog = 'catalog',
    Roster = 'roster'
}

export default class PageRouter {
    _dynamicPages: DynamicPages;
    _linkStack: LinkStack;
    _inCatalog: boolean;
    constructor() {
        this._dynamicPages = {}
        this._linkStack = {
            catalog: new HistoryStack(),
            roster: new HistoryStack()
        };
        this._inCatalog = localStorage.getItem('inCatalog') ? localStorage.getItem('inCatalog') === 'true' : false;
    }
    clearHistory(type: ViewType) {
        this._linkStack[type].history = [];
    }
    async displayView(type: ViewType) {
        const catalogRequested = type === ViewType.Catalog;
        const goToNew = async () => {
            if (catalogRequested)
                await this.goTo(new CatalogSettings);
            else
                await this.goTo(new RostersSettings);
        }

        if (this.inCatalog() === catalogRequested) {
            // already in the requested view
            await goToNew();
            this.clearHistory(type);
        } else {
            // return to the view
            this.setInCatalog(catalogRequested);
            if (this._linkStack[type].currentSettings) {
                await this.goTo(this._linkStack[type].currentSettings, false);
            } else {
                await goToNew();
            }
        }
    }
    setInCatalog(value: boolean) {
        this._inCatalog = value
        localStorage.setItem('inCatalog', this._inCatalog.toString());
    }
    inCatalog() {
        return this._inCatalog;
    }
    _getHistoryKey = () => {
        return this._inCatalog ? 'catalog' : 'roster';
    }
    registerPage(route: string, page: Page) {
        this._dynamicPages[route] = page;
    }
    canGoBack() {
        const key = this._getHistoryKey();
        const linkStack = this._linkStack[key];
        return linkStack.history.length > 0;
    }
    async goBack() {
        if (Overlay.isDisplayed()) {
            // not a blocking overlay, disable it as the 'back' call
            if (Overlay.canDisable()) {
                Overlay.disable();
                return;
            }
            
            // blocking overlay, disable it AND go back a page
            Overlay.disable();
        }
        const key = this._getHistoryKey();
        const linkStack = this._linkStack[key];
        if (linkStack.history.length > 0) {
            const previous = linkStack.history.pop()!!;
            await this.goTo(previous.settings, false);
            window.scrollTo(0, previous.scrollY);
        }
        else
            console.log('ERROR previous is bad');
    }
    async goTo(settings: Settings, updateHistory=true, doLoadPage=true) {
        const key = this._getHistoryKey();
        const name = settings.constructor.name.toLowerCase();
        const types = Object.getOwnPropertyNames(this._dynamicPages);
        for (let i = 0; i < types.length; ++i) {
            const type = types[i];
            const linkStack = this._linkStack[key];
            if (name.includes(type)) {
                if (updateHistory && linkStack.currentSettings) {
                    linkStack.history.push({
                        scrollY: window.scrollY || document.documentElement.scrollTop,
                        settings: linkStack.currentSettings
                    });

                    const currentSettings = linkStack.currentSettings;
                    if (currentSettings.isHistoric()) {
                        history.pushState(null, currentSettings.pageName(), currentSettings.toUrl());
                    }
                }
                linkStack.currentSettings = settings;
                if (doLoadPage) {
                    enableHeaderBackButton();
                    ContextMenu.clear();
                    await this._dynamicPages[type].loadPage(settings);
                    window.scrollTo(0, 0);
                }
                return;
            }
        }
    }
}
