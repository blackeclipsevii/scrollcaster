import { Overlay } from "./overlay";
import { getVar } from "@/lib/functions/getVar";
import BattleTacticCardInterf from "@scrollcaster/shared-lib/BattleTacticCardInterf";

export const displayTacticsOverlay = Overlay.toggleFactory('block', (tc: unknown) =>{
    const tacticCard = tc as BattleTacticCardInterf;

    const modal = document.querySelector(".modal") as HTMLElement;
    modal.style.padding = '0';

    const section = document.createElement('div');
    section.className = 'section';
    // fill the modal window
    section.style.border = `2px solid ${getVar('hover-color')}`;
    section.style.margin = '0px';

    let ele = document.createElement('h3');
    ele.innerHTML = tacticCard.name;
    section.appendChild(ele);

    if (tacticCard.text.length > 0) {
        ele = document.createElement('p');
        ele.innerHTML = tacticCard.text;
        section.appendChild(ele);
    }

    tacticCard.tactics.forEach(tactic => {
        const section2 = document.createElement('div');
        section2.className = 'ability-container';
        ele = document.createElement('h3');
        ele.className = 'ability-header';
        ele.innerHTML = tactic.type.name;
        section2.appendChild(ele);
    
        ele = document.createElement('p');
        ele.innerHTML = tactic.text;

        const body = document.createElement('div');
        body.className = 'ability-body';
        body.appendChild(ele);
        section2.append(body);
        section.appendChild(section2);
    });
    modal.appendChild(section);
});