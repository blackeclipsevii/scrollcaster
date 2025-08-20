import { getVar } from "../functions/getVar.js";
import { getLaunchInsets } from "./InsetEdges.js";
import { getPageRouter } from "./header.js";
import { ViewType } from "./PageRouter.js";

export function initializeFooter(root: string) {
    const main = document.querySelector('.persist');
    if (!main) {
      throw 'div persist must be present';
    }

    const footer = document.createElement('footer');
    footer.innerHTML = `
      <div id='footer-left' class='footer-button footer-left'>
        <img class='navigation-img invert-img' src='${root}/resources/${getVar('book-icon')}'></img>
        <div id='catalog-button'>Catalog</div>
      </div>
      <div id='footer-right' class='footer-button footer-right'>
        <img class='navigation-img invert-img' src='${root}/resources/${getVar('ab-offensive')}'></img>
        <div id='army-button'>Rosters</div>
      </div>
    `;
    main.appendChild(footer);

    const left = document.getElementById('footer-left') as HTMLElement;
    left.onclick = () => {
      getPageRouter()?.displayView(ViewType.Catalog);
    };

    const right = document.getElementById('footer-right') as HTMLElement;
    right.onclick = () => {
      getPageRouter()?.displayView(ViewType.Roster);
    };

    const inset = getLaunchInsets();
    if (inset.bottom) {
        footer.style.paddingBottom = `${inset.bottom}px`;
        left.style.marginBottom = `${inset.bottom}px`;
        right.style.marginBottom = `${inset.bottom}px`;
    }
}