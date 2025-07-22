const hostname = "https://army-thing.fly.dev";
const port = null;
const endpoint = port ? `${hostname}:${port}` : hostname;
var _loadScrollData = false;
var roster = null;
var previousUrl = document.referrer;
var version = '0.3.0beta';
const _inCatalog = localStorage.getItem('inCatalog') ? localStorage.getItem('inCatalog') === 'true' : false;

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
