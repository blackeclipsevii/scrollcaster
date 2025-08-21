import { ContextMenu } from "./contextMenu";
import { getVar } from "@/lib/functions/getVar";
import { CallbackMap } from "./contextMenu";
import { getLaunchInsets } from "./InsetEdges";

import Settings from "@/pages/src/settings/Settings";
import SearchSettings from "@/pages/src/settings/SearchSettings";
import PageRouter from "./PageRouter";
import { leftArrow, searchIcon } from "./images.js";

var _headerMenuId = '';
var _pageRouter: PageRouter | null;

export const absoluteUrl = (relativePath: string) => {
    const rootUrl = window.location.origin;
    return new URL(relativePath, rootUrl).href;
}

export const getPageRouter = () => {
    return _pageRouter;
}

export const goBack = async () => {
    await _pageRouter?.goBack();
}

export const canGoBack = (): boolean => {
    return _pageRouter ? _pageRouter.canGoBack() : false;
}

export interface HeaderOptions {
    name: string;
    leftButton: boolean | undefined;
    rightButton: boolean | undefined;
}

export function initializeHeader(options: HeaderOptions) {
    _pageRouter = new PageRouter();
    (globalThis as unknown as {goBack: unknown}).goBack = goBack as unknown;
    (globalThis as unknown as {canGoBack: unknown}).canGoBack = canGoBack as unknown;

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
        <div class="back-btn"">
            <img class='navigation-img invert-img' src='${leftArrow}'></img>
        </div>
        `;
        const button = left.querySelector('.back-btn') as HTMLButtonElement;
        button.onclick = goBack;
    }

    if (options.rightButton) {
        const right = header.querySelector('.header-right') as HTMLElement;
        right.innerHTML = `
        <button class="export-btn" onclick="exportListAndDisplay()">⤴</button>
        `;
    }
    
    const insetEdges = getLaunchInsets();
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
            <img class='invert-img' src='${searchIcon}'></img>
        `;
        searchButton.onclick = () => {
            const settings = new SearchSettings;
            _pageRouter?.goTo(settings as unknown as Settings);
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
