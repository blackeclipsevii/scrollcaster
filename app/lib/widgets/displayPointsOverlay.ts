import RosterInterf from "../../shared-lib/RosterInterface.js";
import { getVar } from "../functions/getVar.js";
import { validateRoster } from "../functions/validateRoster.js";
import { Overlay } from "./overlay.js";
import { rosterTotalPoints } from "../host.js";
import { insetsAtLaunch } from "../main.js";

export var totalPoints: number = 0;

export const displayPointsOverlay = async (roster: RosterInterf) => {
    let overlay = document.getElementById('pointsOverlay') as HTMLDivElement | null;
    if (!overlay) {
        const main = document.querySelector('.persist');
        overlay = document.createElement('div');
        overlay.id = 'pointsOverlay';
        overlay.style.display = 'none';
        overlay.innerHTML = `
            <div id='validation-icon-wrapper'>
                <img id='validation-icon' src='../../resources/${getVar('check-icon')}'></img>
            </div>
            <div id='points-display-wrapper'>
                <div id='points-display'></div>
                <div id='the-word-points'>points</div>
            </div>
        `;
        if (main)
            main.appendChild(overlay);
    }
    
    refreshPointsOverlay(roster);
    await updateValidationDisplay(roster);
    overlay.style.display = '';
    const inset = insetsAtLaunch;
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
    
    const validationIcon = document.getElementById('validation-icon') as HTMLImageElement;
    if (hasErrors) {
        validationIcon.src = `../../resources/${getVar('danger-icon')}`;
    } else {
        validationIcon.src = `../../resources/${getVar('check-icon')}`;
    }
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
    const pointsOverlay = document.getElementById('points-display');
    if (!pointsOverlay)
        return;

    pointsOverlay.innerHTML = `${rosterTotalPoints(roster)}/${roster.points}`;
}
