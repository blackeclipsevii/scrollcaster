import { getVar } from "../functions/getVar.js";
import { _inCatalog, setInCatalog } from "../host.js";
import { dynamicGoTo } from "./header.js";
import { _linkStack } from "./header.js";
import { InsetEdges } from "./InsetEdges.js";
import { Settings } from "./header.js";

import { CatalogSettings } from "../../pages/src/tome.js";
import { RosterSettings } from "../../pages/src/rosters.js";

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
      if (_inCatalog) {
        dynamicGoTo((new CatalogSettings) as unknown as Settings);
        _linkStack['catalog'].history = [];
      } else {
        localStorage.setItem('inCatalog', 'true');
        setInCatalog(true);
        if (_linkStack['catalog'].currentSettings)
          dynamicGoTo(_linkStack['catalog'].currentSettings, false);
        else
          dynamicGoTo((new CatalogSettings) as unknown as Settings);
      }
    };
    const right = document.getElementById('footer-right') as HTMLElement;
    right.onclick = () => {
      if (!_inCatalog) {
        dynamicGoTo((new RosterSettings) as unknown as Settings);
        _linkStack['roster'].history = [];
      } else {
        localStorage.setItem('inCatalog', 'false');
        setInCatalog(false);
        if (_linkStack['roster'].currentSettings)
          dynamicGoTo(_linkStack['roster'].currentSettings, false);
        else
          dynamicGoTo((new RosterSettings) as unknown as Settings);
      }
    };

    const inset = new InsetEdges;
    if (inset.bottom) {
        footer.style.paddingBottom = `${inset.bottom}px`;
        left.style.marginBottom = `${inset.bottom}px`;
        right.style.marginBottom = `${inset.bottom}px`;
    }
}