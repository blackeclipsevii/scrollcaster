export const ContextMenu = {
    _menuIds: [],
    delete: (id) => {
        const wrapper = document.getElementById(`menu-wrapper-${id}`)
        if (wrapper)
            wrapper.parentElement.removeChild(wrapper);
    },
    updateCallbacks: (id, callbackMap) => { 
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
    },
    clear() {
        this._menuIds.forEach(id => this.delete(id));
        this._menuIds = [];
    },
    create(callbackMap, trackMenu=true) {
        const uniqueId = generateId();
        const ele = document.createElement('div');
        ele.innerHTML = `<button class="menu-btn">⋯</button>`;
        ele.className ='menu-btn-wrapper';
        ele.id = uniqueId;

        const closeOtherMenus = (e) => {
            const { pageX: x, pageY: y } = e;
            const menus = document.getElementsByClassName('menu-wrapper');
            
            // Close the menu only if the click is outside the menu
            for (const menu of menus) {
                if (menu.style.left !== `${x-menu.offsetWidth}px` || 
                    menu.style.top !== `${y}px`) {
                    menu.style.display = 'none';
                }
            };
        }

        const button = ele.querySelector('.menu-btn');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            closeOtherMenus(e);

            const { pageX: x, pageY: y } = e;
            const className = 'menu-wrapper';
            const menu = document.getElementById(`${className}-${uniqueId}`);

            // Move the menu to the body so it’s not clipped
            document.body.appendChild(menu);
            menu.style.display = 'block';
            menu.style.left = `${x-menu.offsetWidth}px`;
            menu.style.top = `${y}px`;
        });

        document.addEventListener('click', closeOtherMenus);

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
            this._menuIds.push(uniqueId);
        }

        return ele;
    }
}
