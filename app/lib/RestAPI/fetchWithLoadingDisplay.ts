import { Overlay } from "../widgets/overlay.js";
import { absoluteUrl } from "../widgets/header.js";
import { endpoint } from "../endpoint.js";
import { isDOMAvailable } from "../host.js";

export const getLoadingMessage = () => {
    const msgs = [
    'Waking the deadwalkers...',
    'Gathering warpstone...',
    'Reforging...',
    'Mustering reinforcements...',
    'Loading...',
    'Kicking the server...',
    'Consulting the scrolls...'
  ];
  const msgIdx = Math.floor(Math.random() * msgs.length);
  return msgs[msgIdx];
}

export const fetchWithLoadingDisplay = async (url: string, callback: null | ((result: unknown) => any) = null, showLoadingDisplay=true) => { 
  const retryInterval = 500;
  const maxRetryTime = 10000;
  let retry = maxRetryTime / retryInterval;
 // url = 'foo.bar'
  let done = false;
  let result = null;
  const _internalFetch = async () => {
    await fetch(url).
    then(async resp => {
      if (resp.status === 500)
        throw 'bad';
      if (resp.status !== 200)
        return null;
      return resp.json();
    }).then(async (obj) =>{
      if (callback) {
        await callback(obj);
      }
      done = true;
      result = obj;
    })
    .catch((error) => {
      console.log(`${url}\n${error}`);
    });
  }
  
  if (isDOMAvailable()) {
    const modal = document.querySelector('.modal') as HTMLElement | null;

    const loadingOverlay = Overlay.toggleFactory('flex', () => {
      if (!modal) return;
      modal.innerHTML = `
      <div style='border-radius: 4vh; background-color: rgb(0,0,0,.5); display: flex; align-items: center; justify-content: center;'>
      <div id="loader-box" style="display: inline-block; width: 1em; height: 1em; margin-right: 3em; margin-top: -2em;">
        <div id="loader" class="loader"></div>
      </div>
      <h3 style="display: inline-block;">${getLoadingMessage()}</h3>
      </div>
      `;
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.flexDirection = 'column';
      modal.style.height ='20em';
      modal.style.width ='20em';
      modal.style.backgroundImage = `URL(${absoluteUrl('resources/dropped-scrolls.jpg')})`
      modal.style.backgroundSize = 'cover';
      modal.style.backgroundPosition = 'center';
      const overlay = modal.closest('.overlay');
      if (overlay)
          overlay.classList.add('block-close');
    });

    const timeoutDisplayOverlay = () => {
      if (!done && showLoadingDisplay) {
        loadingOverlay(null);
      }
    }
    setTimeout(timeoutDisplayOverlay, 250);
  } else {
    showLoadingDisplay = false;
  }
  await _internalFetch();

  while (retry > 0 && !done) {
    await new Promise(resolve => setTimeout(resolve, retryInterval));
    await _internalFetch();
  }
  if (showLoadingDisplay)
    Overlay.disable();

  return result;
}

export const fetchArmies = async (callback: ((result: unknown) => void), displayModalLoad=true) => {
  return await fetchWithLoadingDisplay(`${endpoint}/armies`, callback, displayModalLoad);
}
