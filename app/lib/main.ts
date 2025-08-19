import { RosterSettings } from "../pages/src/rosters.js";
import { getVar } from "./functions/getVar.js";
import { registerAllImporters } from "./functions/import/registerAllImporters.js";
import LocalCache from "./RestAPI/LocalCache.js";
import { initializeFooter } from "./widgets/footer.js";
import { _linkStack, dynamicGoTo, initializeHeader } from "./widgets/header.js";
import { Overlay } from "./widgets/overlay.js";
import { version } from "./RestAPI/version.js";
import { InsetEdges } from "./widgets/InsetEdges.js";
import { addPWAInstallPrompt } from "./widgets/PWAInstaller.js";

export let globalCache: LocalCache | null = null

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

export const isOnline = async (): Promise<boolean> => {
  if (navigator.onLine) {
    try {
      await fetch("https://www.google.com/favicon.ico", { method: "HEAD", mode: "no-cors" });
      return true;
    } catch (error: unknown) {
    
    }
  }
  return false;
}

export let onlineAtLaunch = false;
export const insetsAtLaunch  = new InsetEdges;

(async () => {
  loadIcons();
  initializeHeader({name:'Units', leftButton: true, rightButton: false});
  initializeFooter('../..');
  Overlay.initialize();
  registerAllImporters();

  onlineAtLaunch = await isOnline();
  if (onlineAtLaunch) {
    const bsDataVersion = version.getBsDataVersion();
    const serverVersion = version.getServerVersion();
    globalCache = new LocalCache(`${serverVersion}${bsDataVersion}`);
  } else {
    globalCache = new LocalCache();
  }

  if ('serviceWorker' in navigator) {
    addPWAInstallPrompt();
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./lib/widgets/service-worker.js')
        .then((reg) => console.log('Service Worker registered:', reg))
        .catch((err) => console.error('Service Worker registration failed:', err));
    });
  }
  
  const settings = new RosterSettings;
  _linkStack['roster'].currentSettings = settings;
  dynamicGoTo(settings);
})();