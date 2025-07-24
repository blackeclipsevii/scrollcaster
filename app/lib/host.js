const hostname = "https://army-thing.fly.dev";
const port = null;
const endpoint = port ? `${hostname}:${port}` : hostname;
var _loadScrollData = false;
var roster = null;
var dynamicPages = {};
var previousUrl = document.referrer;
var version = '0.3.1beta';
const _inCatalog = localStorage.getItem('inCatalog') ? localStorage.getItem('inCatalog') === 'true' : false;


function unitTotalPoints(unit) {
    if (!unit.points)
        return 0;

    let pts = unit.points;
    
    if (unit.isReinforced)
        pts += unit.points;

    if ( unit.heroicTrait && unit.heroicTrait.points)
        pts += unit.heroicTrait.points;
    
    if (unit.artefact && unit.artefact.points)
        pts += unit.artefact.points;
    
    return pts;
}

const rosterTotalPoints = (roster) => {
  let total = 0;
  roster.regiments.forEach(reg => {
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

const fetchArmies = async (callback, retry = 10) => {
  fetch(`${endpoint}/armies`).
  then(resp => {
    if (resp.status !== 200)
      throw 'retry';
    return resp.json()
  }).
  then(data => callback(data))
  .catch(() => {
    if (retry > 0) {
      setTimeout(fetchArmies, 500, callback, retry-1);
    }
  });
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
    //if (typeof crypto !== undefined) {
    //    return crypto.randomUUID();
    //}

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

window.addEventListener("beforeunload", () => {
    sessionStorage.setItem(`scrollY${window.document.title}`, window.scrollY);
});

window.addEventListener( "pageshow", function ( event ) {
    const params = new URLSearchParams(window.location.search);
    const lsd = params.get('loadScrollData');
    if (lsd)
        _loadScrollData = true;
});

function loadScrollData() {
    if (_loadScrollData) {
        console.log(`loading scroll`)
        _loadScrollData = false;
        const scrollY = sessionStorage.getItem(`scrollY${window.document.title}`);
        if (scrollY !== null) {
            console.log(`scroll ${scrollY}`)
            window.scrollTo(0, parseInt(scrollY));
        }
    }
}
