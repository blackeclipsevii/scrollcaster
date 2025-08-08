class HistoryStack {
    currentSettings = null;
    history = [];
}
var _linkStack = null;
var _headerMenuId = '';

const absoluteUrl = (relativePath) => {
    const rootUrl = window.location.origin;
    return new URL(relativePath, rootUrl).href;
}

const _getHistoryKey = () => {
    return _inCatalog ? 'catalog' : 'roster';
}

async function dynamicGoTo(settings, updateHistory=true, doLoadPage=true) {
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
                deleteContextMenus();
                await dynamicPages[type].loadPage(settings);
                window.scrollTo(0, 0);
            }
            return;
        }
    }
}

const goBack = async () => {
    const key = _getHistoryKey();
    const linkStack = _linkStack[key];
    if (linkStack.history.length > 0) {
        previous = linkStack.history.pop();
        await dynamicGoTo(previous.settings, false);
        window.scrollTo(0, previous.scrollY);
    }
    else
        console.log('ERROR previous is bad');
}

function initializeHeader(options) {
    _linkStack = {
        catalog: new HistoryStack,
        roster: new HistoryStack
    }

    history.pushState(null, null, location.href);
    window.addEventListener('popstate', (event) => {
        history.pushState(null, null, location.href);
        goBack();
    });

    const main = document.querySelector('.persist');
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
        const left = header.querySelector('.header-left');
        left.innerHTML = `
        <button class="back-btn" onclick="goBack()">‹</button>
        `;
    }

    if (options.rightButton) {
        const right = header.querySelector('.header-right');
        right.innerHTML = `
        <button class="export-btn" onclick="exportListAndDisplay()">⤴</button>
        `;
    }
    
    const insetEdges = new InsetEdges;
    if (insetEdges.top) {
        header.style.paddingTop = `${insetEdges.top}px`;
        const left = header.querySelector('.header-left');
        const right = header.querySelector('.header-right');
        left.style.marginTop = `${insetEdges.top}px`;
        right.style.marginTop = `${insetEdges.top}px`;
    }
}

function setHeaderTitle(name) {
    const element = document.getElementById('army-header');
    element.textContent = name;
}

function enableBackButton() {
    const hdr = document.querySelector('header');
    const left = hdr.querySelector('.header-left');
    left.style.display = '';
}

function disableBackButton() {
    const hdr = document.querySelector('header');
    const left = hdr.querySelector('.header-left');
    left.style.display = 'none';
}

function enableHeaderContextMenu() {
    disableSearchButton();
    const hdr = document.querySelector('header');
    const wrapper = hdr.querySelector('.menu-btn-wrapper');
    wrapper.style.display = '';
}

function disableHeaderContextMenu() {
    const hdr = document.querySelector('header');
    const wrapper = hdr.querySelector('.menu-btn-wrapper');
    if (wrapper)
        wrapper.style.display = 'none';
}

function enableSearchButton() {
    disableHeaderContextMenu();
    const hdr = document.querySelector('header');
    const right = hdr.querySelector('.header-right');
    let searchButton = right.querySelector('.search-button');
    if (!searchButton) {
        searchButton = document.createElement('div');
        searchButton.className = 'search-button';
        searchButton.innerHTML = `
            <img class='invert-img' src='../../resources/${getVar('search-icon')}'></img>
        `;
        searchButton.onclick = () => {
            const settings = new SearchSettings;
            dynamicGoTo(settings);
        };
        right.appendChild(searchButton);
    }
    searchButton.style.display = '';
}

function disableSearchButton() {
    const hdr = document.querySelector('header');
    const right = hdr.querySelector('.header-right');
    let searchButton = right.querySelector('.search-button');
    if (searchButton) {
        searchButton.style.display = 'none';
    }
}

function updateHeaderContextMenu(callbackMap, autoDisplay=true) {
    const hdr = document.querySelector('header');
    const right = hdr.querySelector('.header-right');

    if (_headerMenuId.length > 0) {
        // reuse the existing menu and swap the content
        updateMenuCallbacks(_headerMenuId, callbackMap);
        if (autoDisplay)
            enableHeaderContextMenu();
        return;
    }
    
    const menu = createContextMenu(callbackMap, false);
    _headerMenuId = menu.id;

    const btn = menu.querySelector('.menu-btn');
    btn.style.color = getVar('light-text-color');
    menu.style.zIndex = '1000';
    right.appendChild(menu);
    if (autoDisplay) {
        enableHeaderContextMenu();
    }
}
