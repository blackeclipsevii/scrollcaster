function createContextMenu(uniqueId, id, callbackPostfix) {
    const ele = document.createElement('div');
    ele.innerHTML = `<button class="menu-btn">⋯</button>`;
    const button = ele.querySelector('.menu-btn');
    button.addEventListener('click', (e) => {
        e.preventDefault();
        const { pageX: x, pageY: y } = e;
        const className = 'menu-wrapper';
        const menu = document.getElementById(`${className}-${uniqueId}`);

        // Move the menu to the body so it’s not clipped
        document.body.appendChild(menu);
        menu.style.display = 'block';
        menu.style.left = `${x-menu.offsetWidth}px`;
        menu.style.top = `${y}px`;
    });

    document.addEventListener('click', (e) => {
        const { pageX: x, pageY: y } = e;
        const menus = document.getElementsByClassName('menu-wrapper');
        
        // Close the menu only if the click is outside the menu
        for (const menu of menus) {
            if (menu.style.left !== `${x-menu.offsetWidth}px` || 
                menu.style.top !== `${y}px`) {
                menu.style.display = 'none';
            }
        };
        
    });

    const div = document.createElement('div');
    div.innerHTML = `
    <div id="menu-wrapper-${uniqueId}" class="menu-wrapper">
        <div style="display: none;" class="idx">${id}</div>
        <div style="display: none;" class="uniqueId">${uniqueId}</div>
        <ul class="menu">
            <li onclick="duplicate${callbackPostfix}(this)">Duplicate</li>
            <li onclick="delete${callbackPostfix}(this)">Delete</li>
        </ul>
    </div>
    `;
    ele.appendChild(div);
    return ele;
}