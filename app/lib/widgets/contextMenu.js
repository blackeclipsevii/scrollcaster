var _menuIds = [];

const deleteContextMenu = (id) => {
    //const menu = document.getElementById(id);
    //if (menu)
    //    menu.parentElement.removeChild(menu);

    const wrapper = document.getElementById(`menu-wrapper-${id}`)
    if (wrapper)
        wrapper.parentElement.removeChild(wrapper);
}

const updateMenuCallbacks = (id, callbackMap) => { 
    const wrapper = document.getElementById(`menu-wrapper-${id}`);
    if (!wrapper) {
        console.log(`Error finding context menu wrapper ${id}`)
        return;
    }
    wrapper.innerHTML = `<ul class="menu"></ul>`;
    const menu = wrapper.querySelector('.menu');
    const entryNames = Object.getOwnPropertyNames(callbackMap);
    if (entryNames.length === 0) {
        button.className = 'menu-btn-disabled';
    } else {
        entryNames.forEach(entryName => {
            const li = document.createElement('li');
            li.onclick = callbackMap[entryName];
            li.textContent = entryName;
            menu.appendChild(li);
        });
    }
}

const deleteContextMenus = () => {
    _menuIds.forEach(id => deleteContextMenu(id));
    _menuIds = [];
}

function createContextMenu(callbackMap, trackMenu=true) {
    const uniqueId = generateId();
    const ele = document.createElement('div');
    ele.innerHTML = `<button class="menu-btn">⋯</button>`;
    ele.id = uniqueId;

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
        <ul class="menu">
        </ul>
    </div>
    `;

    const menu = div.querySelector('.menu');
    const entryNames = Object.getOwnPropertyNames(callbackMap);
    if (entryNames.length === 0) {
        button.className = 'menu-btn-disabled';
    } else {
        entryNames.forEach(entryName => {
            const li = document.createElement('li');
            li.onclick = callbackMap[entryName];
            li.textContent = entryName;
            menu.appendChild(li);
        });
    }
    ele.appendChild(div);

    if (trackMenu) {
        _menuIds.push(uniqueId);
    }

    return ele;
}