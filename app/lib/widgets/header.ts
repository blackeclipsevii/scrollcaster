import { _inCatalog } from "../host.js";
import { InsetEdges } from "./InsetEdges.js";
import { dynamicPages } from "../host.js";
import { ContextMenu } from "./contextMenu.js";
import { getVar } from "../functions/getVar.js";
import { CallbackMap } from "./contextMenu.js";

import { SearchSettings } from "../../pages/src/search.js";

interface HistoryEle {
    scrollY: number;
    settings: Settings;
}

class HistoryStack {
    currentSettings: Settings | null = null;
    history: HistoryEle[] = [];
}

export interface Settings {
    [name: string]: unknown;
}

interface LinkStack {
    catalog: HistoryStack,
    roster: HistoryStack
}

export var _linkStack: LinkStack = {catalog: new HistoryStack, roster: new HistoryStack};
var _headerMenuId = '';

export const absoluteUrl = (relativePath: string) => {
    const rootUrl = window.location.origin;
    return new URL(relativePath, rootUrl).href;
}

const _getHistoryKey = () => {
    return _inCatalog ? 'catalog' : 'roster';
}

export async function dynamicGoTo(settings: Settings, updateHistory=true, doLoadPage=true) {
    const key = _getHistoryKey();
    const name = settings.constructor.name.toLowerCase();
    const types = Object.getOwnPropertyNames(dynamicPages);
    for (let i = 0; i < types.length; ++i) {
        const type = types[i];
        const linkStack = _linkStack[key];
        if (name.includes(type)) {
            if (updateHistory && linkStack.currentSettings) {
                linkStack.history.push({
                    scrollY: window.scrollY || document.documentElement.scrollTop,
                    settings: linkStack.currentSettings
                });
            }
            linkStack.currentSettings = settings;
            if (doLoadPage) {
                enableBackButton();
                ContextMenu.clear();
                await dynamicPages[type].loadPage(settings);
                window.scrollTo(0, 0);
            }
            return;
        }
    }
}

export const goBack = async () => {
    const key = _getHistoryKey();
    const linkStack = _linkStack[key];
    if (linkStack.history.length > 0) {
        const previous = linkStack.history.pop()!!;
        await dynamicGoTo(previous.settings, false);
        window.scrollTo(0, previous.scrollY);
    }
    else
        console.log('ERROR previous is bad');
}

export interface HeaderOptions {
    name: string;
    leftButton: boolean | undefined;
    rightButton: boolean | undefined;
}

export function initializeHeader(options: HeaderOptions) {
    _linkStack = {
        catalog: new HistoryStack,
        roster: new HistoryStack
    }

    history.pushState(null, null!!, location.href);
    window.addEventListener('popstate', (event) => {
        history.pushState(null, null!!, location.href);
        goBack();
    });

    const main = document.querySelector('.persist');
    if (!main) {
        throw 'persist must exist';
    }
    const header = document.createElement('header');
    header.innerHTML = `
        <div class="header-left">
        </div>
        <div class="header-center">
            <div id="army-header">${options.name}</div>
        </div>
        <div class="header-right">
        </div>
    `;
    main.appendChild(header);

    if (options.leftButton) {
        const left = header.querySelector('.header-left') as HTMLElement;
        left.innerHTML = `
        <button class="back-btn" onclick="goBack()">‹</button>
        `;
    }

    if (options.rightButton) {
        const right = header.querySelector('.header-right') as HTMLElement;
        right.innerHTML = `
        <button class="export-btn" onclick="exportListAndDisplay()">⤴</button>
        `;
    }
    
    const insetEdges = new InsetEdges;
    if (insetEdges.top) {
        header.style.paddingTop = `${insetEdges.top}px`;
        const left = header.querySelector('.header-left') as HTMLElement | null;
        if (left)
            left.style.marginTop = `${insetEdges.top}px`;
        const right = header.querySelector('.header-right') as HTMLElement | null;
        if (right)
            right.style.marginTop = `${insetEdges.top}px`;
    }
}

export const setHeaderTitle = (name: string) => {
    const element = document.getElementById('army-header');
    if (element)
        element.textContent = name;
}

export function enableBackButton() {
    const hdr = document.querySelector('header');
    if (hdr) {
        const left = hdr.querySelector('.header-left') as HTMLElement | null;
        if (left) {
            left.style.display = '';
        }
    }
}

export function disableBackButton() {
    const hdr = document.querySelector('header');
    if (hdr) {
        const left = hdr.querySelector('.header-left') as HTMLElement | null;
        if (left) {
            left.style.display = 'none';
        }
    }
}

export function enableHeaderContextMenu() {
    disableSearchButton();
    const hdr = document.querySelector('header');
    if (hdr) {
        const wrapper = hdr.querySelector('.menu-btn-wrapper') as HTMLElement | null;
        if (wrapper) {
            wrapper.style.display = '';
        }
    }
}

export function disableHeaderContextMenu() {
    const hdr = document.querySelector('header');
    if (hdr) {
        const wrapper = hdr.querySelector('.menu-btn-wrapper') as HTMLElement | null;
        if (wrapper)
            wrapper.style.display = 'none';
    }
}

export function enableSearchButton() {
    disableHeaderContextMenu();
    const hdr = document.querySelector('header');
    if (!hdr)
        return;

    const right = hdr.querySelector('.header-right');
    if (!right)
        return;

    let searchButton = right.querySelector('.search-button') as HTMLElement;
    if (!searchButton) {
        searchButton = document.createElement('div');
        searchButton.className = 'search-button';
        searchButton.innerHTML = `
            <img class='invert-img' src='../../resources/${getVar('search-icon')}'></img>
        `;
        searchButton.onclick = () => {
            const settings = new SearchSettings;
            dynamicGoTo(settings as unknown as Settings);
        };
        right.appendChild(searchButton);
    }
    searchButton.style.display = '';
}

export function disableSearchButton() {
    const hdr = document.querySelector('header');
    if (!hdr)
        return;
    
    const right = hdr.querySelector('.header-right');
    if (!right)
        return;

    let searchButton = right.querySelector('.search-button') as HTMLElement | null;
    if (searchButton) {
        searchButton.style.display = 'none';
    }
}

export function updateHeaderContextMenu(callbackMap: CallbackMap, autoDisplay=true) {
    const hdr = document.querySelector('header');
    if (!hdr)
        return;

    const right = hdr.querySelector('.header-right');
    if (!right)
        return;

    if (_headerMenuId.length > 0) {
        // reuse the existing menu and swap the content
        ContextMenu.updateCallbacks(_headerMenuId, callbackMap);
        if (autoDisplay)
            enableHeaderContextMenu();
        return;
    }
    
    const menu = ContextMenu.create(callbackMap, false);
    _headerMenuId = menu.id;

    const btn = menu.querySelector('.menu-btn') as null | HTMLElement;
    if (btn)
        btn.style.color = getVar('light-text-color');

    menu.style.zIndex = '1000';
    right.appendChild(menu);
    if (autoDisplay) {
        enableHeaderContextMenu();
    }
}
