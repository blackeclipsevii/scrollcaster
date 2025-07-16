
function initializeHeader(options) {
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
        <button class="back-btn" onclick="goBack()">←</button>
        `;
    }

    if (options.rightButton) {
        const right = header.querySelector('.header-right');
        right.innerHTML = `
        <button class="export-btn" onclick="exportListAndDisplay()">^</button>
        `;
    }
}