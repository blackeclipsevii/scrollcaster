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

    const main = document.querySelector('.persist');
    const header = document.createElement('header');
    header.innerHTML = `
        <div class="header-left">
        </div>
        <div class="header-center">
            <span id="army-header">${options.name}</span>
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
}

function setHeaderTitle(name) {
    const element = document.getElementById('army-header');
    element.textContent = name;
}
function enableBackButton() {
    const hdr = document.querySelector('header');
    const left = hdr.querySelector('.header-left');
    left.style.display = 'block';
}
function disableBackButton() {
    const hdr = document.querySelector('header');
    const left = hdr.querySelector('.header-left');
    left.style.display = 'none';
}
function enableHeaderContextMenu() {
    const hdr = document.querySelector('header');
    const right = hdr.querySelector('.header-right');
    right.style.display = '';
}

function updateHeaderContextMenu(callbackMap, autoDisplay=true) {
    if (_headerMenuId.length > 0) {
        deleteContextMenu(_headerMenuId);
        _headerMenuId = '';
    }
    
    const menu = createContextMenu(callbackMap, false);
    _headerMenuId = menu.id;

    const btn = menu.querySelector('.menu-btn');
    btn.style.color = 'white';
    btn.style.top = '.5em';
    menu.style.zIndex = '1000';
    const hdr = document.querySelector('header');
    const right = hdr.querySelector('.header-right');
    right.appendChild(menu);
    if (autoDisplay) {
        right.style.display = '';
    }
}

function disableHeaderContextMenu() {
    const hdr = document.querySelector('header');
    const right = hdr.querySelector('.header-right');
    right.style.display = 'none';
}