import { generateId } from "@/lib/functions/uniqueIdentifier";
import { dotsIcon } from "./images.js";

export interface CallbackMap {
    [name: string]: unknown;
}

export const ContextMenu = {
    _menuIds: [] as string[],
    delete: (id: string) => {
        const wrapper = document.getElementById(`menu-wrapper-${id}`)
        if (wrapper && wrapper.parentElement)
            wrapper.parentElement.removeChild(wrapper);
    },
    updateCallbacks: (id: string, callbackMap: CallbackMap) => { 
        const wrapper = document.getElementById(`menu-wrapper-${id}`);
        if (!wrapper) {
            console.log(`Error finding context menu wrapper ${id}`)
            return;
        }
        wrapper.innerHTML = `<ul class="menu"></ul>`;
        const menu = wrapper.querySelector('.menu');
        if (!menu) {
            return;
        }

        const entryNames = Object.getOwnPropertyNames(callbackMap);
        if (entryNames.length === 0) {
            // to-do
            //button.className = 'menu-btn-disabled';
        } else {
            entryNames.forEach(entryName => {
                const li = document.createElement('li');
                li.onclick = callbackMap[entryName] as (this: GlobalEventHandlers, ev: MouseEvent) => any;
                li.textContent = entryName;
                menu.appendChild(li);
            });
        }
    },
    clear() {
        this._menuIds.forEach(id => this.delete(id));
        this._menuIds = [];
    },
    create(callbackMap: CallbackMap, trackMenu=true) {
        const uniqueId = generateId();
        const ele = document.createElement('div');
        ele.innerHTML = `
            <div class="menu-btn">
                <img class='menu-icon invert-img' src='${dotsIcon}'></img>
            </div>
        `;
        ele.className ='menu-btn-wrapper';
        ele.id = uniqueId;

        const closeOtherMenus = (e: {pageX: number, pageY: number}) => {
            const { pageX: x, pageY: y } = e;
            const menus = Array.from(document.getElementsByClassName('menu-wrapper') as HTMLCollectionOf<HTMLElement>);
            
            // Close the menu only if the click is outside the menu
            for (const menu of menus) {
                if (menu.style.left !== `${x-menu.offsetWidth}px` || 
                    menu.style.top !== `${y}px`) {
                    menu.style.display = 'none';
                }
            };
        }

        const button = ele.querySelector('.menu-btn') as HTMLElement;
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            closeOtherMenus(e);

            const { pageX: x, pageY: y } = e;
            const className = 'menu-wrapper';
            const menu = document.getElementById(`${className}-${uniqueId}`) as HTMLElement;

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

        const menu = div.querySelector('.menu') as HTMLElement;
        const entryNames = Object.getOwnPropertyNames(callbackMap);
        if (entryNames.length === 0) {
            button.className = 'menu-btn-disabled';
        } else {
            entryNames.forEach(entryName => {
                const li = document.createElement('li');
                li.onclick = callbackMap[entryName] as (this: GlobalEventHandlers, ev: MouseEvent) => any;
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
