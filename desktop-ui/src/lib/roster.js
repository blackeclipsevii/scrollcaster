
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
    }).then(response => { 
        console.log(response);
        roster = response.json() 
    });
    return roster;
}

async function putRoster(roster) {
    await fetch(`${hostname}:${port}/roster?id=${roster.id}`, {
        method: "PUT",
        body: JSON.stringify(roster),
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
  await fetch(`${hostname}:${port}/roster?id=${id}`,{
      method: "DELETE"
  });
}