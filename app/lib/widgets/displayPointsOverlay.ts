import RosterInterf from "../../../shared-lib/RosterInterface.js";
import { getVar } from "../functions/getVar.js";
import { InsetEdges } from "./InsetEdges.js";
import { validateRoster } from "../functions/validateRoster.js";
import { Overlay } from "./overlay.js";
import { rosterTotalPoints } from "../host.js";

export var totalPoints: number = 0;

export const displayPointsOverlay = () => {
    let overlay = document.getElementById('pointsOverlay');
    if (!overlay) {
        const main = document.querySelector('.persist');
        overlay = document.createElement('div');
        overlay.id = 'pointsOverlay';
        if (main)
            main.appendChild(overlay);
    } else {
        overlay.style.display = '';
    }
    const inset = new InsetEdges;
    if (inset.bottom) {
        overlay.style.bottom = `${inset.bottom + 75}px`;
    }
}

export const hidePointsOverlay = () => {
    let overlay = document.getElementById('pointsOverlay');
    if (!overlay)
        return;
    overlay.style.display = 'none';
}

export async function updateValidationDisplay(roster: RosterInterf) {
    const errors = await validateRoster(roster);
    const hasErrors = errors.length > 0;
    const postfix = hasErrors ? 'invalid' : 'valid';

    const pointsOverlay = document.getElementById('pointsOverlay') as HTMLElement | null;
    if (!pointsOverlay)
        return;
    
    pointsOverlay.className = `points-overlay-${postfix}`;

    pointsOverlay.onclick = Overlay.toggleFactory('flex', () =>{
        const modal = document.querySelector(".modal") as HTMLElement | null;
        if (!modal)
            return;

        modal.style.border = `2px solid ${getVar('hover-color')}`;

        const title = document.createElement('h3');
        title.innerHTML = 'Validation Errors';
        modal.appendChild(title);
    
        const container = document.createElement('div');

        if (hasErrors) {
            errors.forEach(error => {
                const subSection = document.createElement('div');
                subSection.className = 'section';
                subSection.style.marginLeft = '0px';
                subSection.style.marginRight = '0px';
                subSection.style.padding = '1em';
                subSection.style.backgroundColor = getVar('hover-color');
                subSection.style.border = `2px solid ${getVar('background-color')}`;

                const label = document.createElement('div');
                label.className = 'ability-label';
                label.style.fontWeight = 'bold';
                label.style.backgroundColor = getVar('red-color');
                label.textContent = 'Error';
                label.style.marginTop = '0';
                label.style.marginBottom = '1em';
                subSection.appendChild(label);

                const p = document.createElement('p') as HTMLElement;
                p.style.padding = '0px';
                p.style.margin = '0px';
                p.innerHTML = error;
                subSection.appendChild(p);
                container.appendChild(subSection);
            });
        } else {
            const subSection = document.createElement('div');
            subSection.className = 'section';
            subSection.style.marginLeft = '0px';
            subSection.style.marginRight = '0px';
            subSection.style.padding = '1em';
            subSection.style.backgroundColor = getVar('hover-color');
            subSection.style.border = `2px solid ${getVar('background-color')}`;

            const label = document.createElement('div');
            label.className = 'ability-label';
            label.style.backgroundColor = getVar('green-color');
            label.textContent = 'Valid';
            label.style.fontWeight = 'bold';
            label.style.marginTop = '0';
            label.style.marginBottom = '1em';
            subSection.appendChild(label);

            const p = document.createElement('p');
            p.style.padding = '0px';
            p.style.margin = '0px';
            p.innerHTML = `Your list is valid.`;
            subSection.appendChild(p);
            container.appendChild(subSection);
        }
    
        modal.appendChild(container);
    });
};

export function refreshPointsOverlay(roster: RosterInterf) {
    let pointsOverlay = document.getElementById('pointsOverlay');
    if (!pointsOverlay)
        return;

    pointsOverlay.textContent = `${rosterTotalPoints(roster)} / ${roster.points} pts`;
}
