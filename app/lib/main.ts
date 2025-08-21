import { registerAllImporters } from "./functions/import/registerAllImporters";
import { initializeFooter } from "./widgets/footer";
import { initializeHeader } from "./widgets/header";
import { Overlay } from "./widgets/overlay";
import { initializeLaunchInsets } from "./widgets/InsetEdges";
import { initializeGlobalCache, isOnline } from "./RestAPI/LocalCache";

import RostersSettings from "@/pages/src/settings/RostersSettings";
import { version } from "./RestAPI/version";
// import { addPWAInstallPrompt } from "./widgets/PWAInstaller";

import { registerAllPages } from "@/pages/src/registerAllPages";

(async () => {
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

  if ('serviceWorker' in navigator) {
    //addPWAInstallPrompt();
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('service-worker.js')
        .then((reg) => console.log('Service Worker registered:', reg))
        .catch((err) => console.error('Service Worker registration failed:', err));
    });
  }

  registerAllPages(new RostersSettings);
})();