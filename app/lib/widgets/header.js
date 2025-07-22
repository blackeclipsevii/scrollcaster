var _linkStack = null;

function _saveStack() {
    const key = _inCatalog ? 'catalog-link-stack' : 'roster-link-stack';
    const json = JSON.stringify(_linkStack);
    localStorage.setItem(key, json);
}

function goBack() {
    if (_linkStack && _linkStack.length > 0) {
        previousUrl = _linkStack.pop();
        _saveStack();
    }

    window.location.href = previousUrl;
}

function goTo(nextUrl,doNavigation=true) {    
    let myUrl = window.location.href;
    if (!myUrl.includes('loadScrollData')) {
        if (myUrl.includes('?')) {
            myUrl = `${myUrl}&loadScrollData=true`
        } else {
            myUrl = `${myUrl}?loadScrollData=true`
        }
    }
    _linkStack.push(myUrl);
    _saveStack();
    if(doNavigation)
        window.location.href = nextUrl;
}

function initializeHeader(options) {
    const key = _inCatalog ? 'catalog-link-stack' : 'roster-link-stack';
    
    _linkStack = (() => {
        const tmp = localStorage.getItem(key);
        if (tmp)
          return JSON.parse(tmp);
        
        return [];
    })();

    const main = document.querySelector('.main');
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