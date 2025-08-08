
// if warscroll options are selected
// only those will be displayed
const DYNAMIC_WARSCROLL = false;

var roster = null;
var dynamicPages = {};
var previousUrl = document.referrer;
let _inCatalog = localStorage.getItem('inCatalog') ? localStorage.getItem('inCatalog') === 'true' : false;

const getVar = (varName) => {
    const rootStyles = getComputedStyle(document.documentElement);
    return rootStyles.getPropertyValue(`--${varName}`).trim();
}

function unitTotalPoints(unit) {
  if (!unit || !unit.points)
      return 0;

  let pts = unit.points;
  
  if (unit.isReinforced)
      pts += unit.points;

  if (unit.enhancements) {
    const enhancements = Object.values(unit.enhancements);
    enhancements.forEach(enhance => {
      if (enhance.slot) {
        pts += enhance.slot.points;
      }
    });
  }

  return pts;
}

const rosterTotalPoints = (roster) => {
  let total = 0;
  roster.regiments.forEach(reg => {
    if (reg.leader) {
      total += unitTotalPoints(reg.leader);
    }
    reg.units.forEach(unit => {
      total += unitTotalPoints(unit);
    });
  });

  roster.auxiliaryUnits.forEach(unit => {
    total += unitTotalPoints(unit);
  });

  const lores = Object.values(roster.lores);
  lores.forEach(lore => {
    if (lore && lore.points) {
      total += lore.points;
    }
  });

  if (roster.terrainFeature && roster.terrainFeature.points) {
    total += roster.terrainFeature.points;
  }
  
  return total;
}

const getLoadingMessage = () => {
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

const fetchWithLoadingDisplay = async (url, callback=null, showLoadingDisplay=true) => { 
  const retryInterval = 500;
  const maxRetryTime = 10000;
  let retry = maxRetryTime / retryInterval;
 // url = 'foo.bar'
  let done = false;
  let result = null;
  _internalFetch = async () => {
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
  const modal = document.querySelector('.modal');

  const loadingOverlay = Overlay.toggleFactory('flex', () => {
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
    modal.closest('.overlay').classList.add('block-close');
  });

  const timeoutDisplayOverlay = () => {
    if (!done && showLoadingDisplay) {
      loadingOverlay();
    }
  }
  setTimeout(timeoutDisplayOverlay, 250);
  await _internalFetch();

  while (retry > 0 && !done) {
    await new Promise(resolve => setTimeout(resolve, retryInterval));
    await _internalFetch();
  }
  if (showLoadingDisplay)
    Overlay.disable();

  return result;
}

const fetchArmies = async (callback, displayModalLoad=true) => {
  return await fetchWithLoadingDisplay(`${endpoint}/armies`, callback, displayModalLoad);
}

const displayPoints = (pointsElement, points, pts='pts') => {
    if (points > 0) {
        pointsElement.textContent = `${points} ${pts}`;
    } else {
        pointsElement.style.display = 'none';
        pointsElement.textContent = '';
    }
}

function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
