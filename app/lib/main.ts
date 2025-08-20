import { getVar } from "./functions/getVar.js";
import { registerAllImporters } from "./functions/import/registerAllImporters.js";
import { initializeFooter } from "./widgets/footer.js";
import { initializeHeader } from "./widgets/header.js";
import { Overlay } from "./widgets/overlay.js";
import { initializeLaunchInsets } from "./widgets/InsetEdges.js";
import { initializeGlobalCache, isOnline } from "./RestAPI/LocalCache.js";

import RostersSettings from "../pages/src/settings/RostersSettings.js";
import { version } from "./RestAPI/version.js";

import { registerAllPages } from "../pages/src/registerAllPages.js";

const loadIcons = async () => {
  const icons = [
    'ab-offensive', 'ab-rallying', 'ab-control',
    'ab-movement', 'ab-special', 'ab-shooting',
    'ab-defensive', 'ab-damage', 'right-arrow',
    'search-icon', 'book-icon', 'left-arrow',
    'gear-icon', 'plus-icon', 'minus-icon',
    'danger-icon', 'check-icon'
  ];

  const newDiv = document.createElement('div');
  newDiv.id = 'icon-loader';
  const body = document.querySelector('body') as HTMLBodyElement;
  body.appendChild(newDiv);

  icons.forEach(iconName => {
    const img = document.createElement('img');
    img.src = `../../resources/${getVar(iconName)}`;
    img.style.position = 'absolute';
    img.style.top = "-1000";
    img.style.left = "-1000";
    newDiv.appendChild(img);
  });

  newDiv.style.display = 'none';
}

(async () => {
  // don't wait for this
  loadIcons();

  if (await isOnline()) {
    const bsDataVersion = version.getBsDataVersion();
    const serverVersion = version.getServerVersion();
    await initializeGlobalCache(`${bsDataVersion}${serverVersion}`);
  } else {
    await initializeGlobalCache('');
  }

  initializeLaunchInsets();
  initializeHeader({name:'Scrollcaster', leftButton: true, rightButton: false});
  initializeFooter('../..');
  Overlay.initialize();
  registerAllImporters();
  
  registerAllPages(new RostersSettings);
})();