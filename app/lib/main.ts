import { RosterSettings } from "../pages/src/rosters.js";
import { getVar } from "./functions/getVar.js";
import { registerAllImporters } from "./functions/import/registerAllImporters.js";
import { initializeFooter } from "./widgets/footer.js";
import { _linkStack, dynamicGoTo, initializeHeader } from "./widgets/header.js";
import { Overlay } from "./widgets/overlay.js";

const loadIcons = async () => {
  const icons = [
    'ab-offensive', 'ab-rallying', 'ab-control',
    'ab-movement', 'ab-special', 'ab-shooting',
    'ab-defensive', 'ab-damage', 'right-arrow',
    'search-icon', 'book-icon', 'left-arrow',
    'gear-icon', 'plus-icon', 'minus-icon',
    'danger-icon', 'check-icon'
  ];

  icons.forEach(iconName => {
    const img = document.createElement('img');
    const body = document.querySelector('body') as HTMLBodyElement;
    img.src = `../../resources/${getVar(iconName)}`;
    img.style.position = 'absolute';
    img.style.top = "-1000";
    img.style.left = "-1000";
    body.appendChild(img);
  });
}

(() => {
  loadIcons();
  initializeHeader({name:'Units', leftButton: true, rightButton: false});
  initializeFooter('../..');
  Overlay.initialize();
  registerAllImporters();

  const settings = new RosterSettings;
  _linkStack['roster'].currentSettings = settings;
  dynamicGoTo(settings);

})();