
import { Costed } from "@/shared-lib/BasicObject";
import RosterInterf from "@/shared-lib/RosterInterface";
import { displayPoints } from "@/lib/host";
import { CallbackMap, ContextMenu } from "@/lib/widgets/contextMenu";

import UnitSettings from "@/pages/src/settings/UnitsSettings";
import { getPageRouter } from "@/lib/widgets/header";

export const setRegimentIdx = (regSlot: HTMLDivElement, index: number) => {
    const hiddenIdx = regSlot.querySelector('.regiment-idx') as HTMLElement;
    hiddenIdx.textContent = `${index}`;
    regSlot.id = `regiment-item-${index+1}`;
    const title = regSlot.querySelector('.regiment-item-title') as HTMLElement;
    title.innerHTML = `Regiment ${index+1}`;
}

export default class RegimentSlot {
    _regimentSlot: HTMLDivElement;
    _parent: HTMLElement;
    constructor(parent: HTMLElement, roster: RosterInterf, id?: string) {
        this._parent = parent;
        const div = document.createElement('div');
        div.innerHTML = `
        <span style="display: none;" class="regiment-idx"></span>
        <div class="regiment-header" style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="regiment-item-title"></span>
            <span class="regiment-item-points" style="margin-left:auto;"></span>
        </div>
        
        <!-- Content that will hold hero/units -->
        <div class="regiment-content" style="margin-top: 0.5rem;"></div>

        <!-- Add button below content -->
        <div style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
            <button class="add-unit-button">Add Unit +</button>
        </div>
        `;
        div.className = `regiment-item`;
        const btn = div.querySelector(`button`) as HTMLButtonElement;
        btn.onclick = () => {
            const parent = div;
            const idx = Number(parent.id.substring(parent.id.length-1)) - 1;
            const content = parent.querySelector('.regiment-content') as HTMLElement;
            const count = content.children.length;

            const settings = new UnitSettings;
            settings.roster = roster;
            settings.regimentIndex = idx;
            if (count === 0)
                settings.type = 'hero';

            getPageRouter()?.goTo(settings);
        };
        this._regimentSlot = div;
        if (id) {
            this._regimentSlot.id = id;
        }
    }

    delete(): void {
        this._parent.removeChild(this._regimentSlot);
    }

    setTitle(title: string) {
        const element = this._regimentSlot.querySelector('.regiment-item-title') as HTMLElement | null;
        if (element)
            element.innerHTML = title;
    }

    setIndex(index: number) {
        setRegimentIdx(this._regimentSlot, index);
    }

    getIndex(): number {
        const _div = this._regimentSlot.querySelector('.regiment-idx') as HTMLElement;
        return Number(_div.textContent);
    }

    disableAddButton() {
        const deadButton = this._regimentSlot.querySelector('.add-unit-button') as HTMLButtonElement | null;
        if (deadButton){
            deadButton.style.display = 'none';
        }
    }

    getContentElement() {
        return this._regimentSlot.querySelector('.regiment-content') as HTMLElement;
    }

    displayPoints(element: Costed) {
        const pointsSpan = this._regimentSlot.querySelector('.regiment-item-points') as HTMLElement | null;
        if (pointsSpan)
            displayPoints(pointsSpan, element.points, 'pts', true);
    }

    initializeContextMenu(callbackMap: CallbackMap) {
        const menu = ContextMenu.create(callbackMap);
        const regHdr = this._regimentSlot.querySelector(".regiment-header") as HTMLElement;
        regHdr.appendChild(menu);
    }

    attachAndDisplay() {
        this._regimentSlot.removeAttribute('style');
        this._parent.appendChild(this._regimentSlot);
    }
}