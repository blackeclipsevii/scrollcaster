
async function getRosters() {
    let rosters = null;
    await fetch(`${hostname}:${port}/roster`,{
        method: "GET" // default, so we can ignore
    }).then(response => { rosters = response.json() });
    return rosters;
}

async function getNewRoster(army) {
    // to-do this should just be an endpoint
    let roster = null;
    await fetch(encodeURI(`${hostname}:${port}/roster?army=${army}`), {
        method: "GET" // default, so we can ignore
    }).then(response => { 
        console.log(response);
        roster = response.json();
    });
    return roster;
}

async function getRoster(id) {
    const json = localStorage.getItem(id);
    if (json) {
        console.log(`using local storage for ${id}`);
        console.log(json);
        return JSON.parse(json);
    }

    let roster = null;
    await fetch(`${hostname}:${port}/roster?id=${id}`, {
        method: "GET" // default, so we can ignore
    }).then(response => { 
        console.log(response);
        roster = response.json() 
    });
    return roster;
}

async function putRoster(roster) {
    const json = JSON.stringify(roster);
    localStorage.setItem(roster.id, json);
    await fetch(`${hostname}:${port}/roster?id=${roster.id}`, {
        method: "PUT",
        body: json,
        headers: { 'Content-Type': 'application/json' }
    });
}

async function updateRoster(partialRoster) {
  await fetch(`${hostname}:${port}/roster?id=${roster.id}`,{
      method: "POST",
      body: JSON.stringify(partialRoster)
  });
}

async function deleteRoster(id) {
    localStorage.removeItem(id);
  await fetch(`${hostname}:${port}/roster?id=${id}`,{
      method: "DELETE"
  });
}

