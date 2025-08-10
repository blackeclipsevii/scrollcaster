import { RosterSettings } from "../pages/src/rosters.js";
import { initializeFooter } from "./widgets/footer.js";
import { _linkStack, dynamicGoTo, initializeHeader } from "./widgets/header.js";
import { Overlay } from "./widgets/overlay.js";

(() => {
  initializeHeader({name:'Units', leftButton: true, rightButton: false});
  initializeFooter('../..');
  Overlay.initialize();
    
  const settings = new RosterSettings;
  _linkStack['roster'].currentSettings = settings;
  dynamicGoTo(settings);
})();