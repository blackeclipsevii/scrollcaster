var _storageName = 'rosters';

function rosterEndpoint(): string {
    const user = getUniqueIdentifier();
    return `${endpoint}/roster?uuid=${user}`;
}

function _getRosters() {
    const json = localStorage.getItem(_storageName);
    if (!json)
        return {};
    return JSON.parse(json);
}

function _storeRosters(rosters: unknown) {
    const json = JSON.stringify(rosters);
    localStorage.setItem('rosters', json);
}

async function getRosters() {
    /*
    let rosters = null;
    const endpoint = rosterEndpoint();
    await fetch(encodeURI(endpoint),{
        method: "GET" // default, so we can ignore
    }).then(response => { rosters = response.json() });
    return rosters;
    */
    const rosters = _getRosters();
    return Object.getOwnPropertyNames(rosters);
}

async function getNewRoster(army: string) {
    const endpoint = rosterEndpoint();
    const roster = await fetch(encodeURI(`${endpoint}&army=${army}`), {
        method: "GET" // default, so we can ignore
    }).then(response => response.json());

    if (roster) {
        await version.stampVersion(roster);
    }

    return roster;
}

async function getRoster(id: string) {
    const rosters = _getRosters();
    return rosters[id];
/*
    const endpoint = rosterEndpoint();
    let roster = null;
    await fetch(`${endpoint}&id=${id}`, {
        method: "GET" // default, so we can ignore
    }).then(response => { 
        console.log(response);
        roster = response.json() 
    });
    return roster;
    */
}

async function putRoster(roster: {id: string}) {
    const rosters = _getRosters();
    rosters[roster.id] = roster;
    _storeRosters(rosters);
    /*
    const endpoint = rosterEndpoint();
    await fetch(`${endpoint}&id=${roster.id}`, {
        method: "PUT",
        body: json,
        headers: { 'Content-Type': 'application/json' }
    });
    */
}

async function deleteRosters() {
  _storeRosters({});
}

async function deleteRoster(id: string) {
    const rosters = _getRosters();
    if (rosters[id])
        delete rosters[id];
    _storeRosters(rosters);
    /*
    const endpoint = rosterEndpoint();
    localStorage.removeItem(id);
  await fetch(`${endpoint}&id=${id}`,{
      method: "DELETE"
  });
  */
}

