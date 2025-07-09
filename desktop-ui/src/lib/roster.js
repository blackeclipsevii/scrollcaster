
async function getRosters() {
    let rosters = null;
    await fetch(`${hostname}:${port}/roster`,{
        method: "GET" // default, so we can ignore
    }).then(response => { rosters = response.json() });
    return rosters;
}

async function getRoster(id) {
    let roster = null;
    await fetch(`${hostname}:${port}/roster?id=${id}`, {
        method: "GET" // default, so we can ignore
    }).then(response => { roster = response.json() });
    return roster;
}

async function putRoster(roster) {
    await fetch(`${hostname}:${port}/roster?id=${roster.name}`, {
        method: "PUT",
        body: JSON.stringify(roster),
        headers: { 'Content-Type': 'application/json' }
    });
}

async function updateRoster(partialRoster) {
  await fetch(`${hostname}:${port}/roster?id=${partialRoster.name}`,{
      method: "POST" // default, so we can ignore
  });
}