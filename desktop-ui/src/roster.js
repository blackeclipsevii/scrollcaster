
const hostname = "http://localhost";
const port = 3000;

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

function toggleOverlay() {
    const overlay = document.getElementById("overlay");
    if (overlay.style.display === "flex") {
      overlay.style.display = "none";
    } else {
      overlay.style.display = "flex";
      fetch(`${hostname}:${port}/armies`).
      then(resp => resp.json()).
      then(armies => {
        let armySelect = document.getElementById("army");
        armies.forEach((army)=> {
          const option = document.createElement("option");
          option.value = army;
          option.textContent = army;
          armySelect.appendChild(option);
        });
      });
    }
  }

  async function viewRosters() {
    const armies = document.getElementById("army-list");
    armies.innerHTML = "";

    const rosters = await getRosters();
    for (let i = 0; i < rosters.length; ++i) {
        const roster = await getRoster(rosters[i]);
        const entry = document.createElement("div");
        entry.className = "army-card";
        entry.innerHTML = `
        <strong>${roster.name}</strong><br />
        ${roster.army} | ${roster.ruleset} | ${roster.points} pts
        <p>${roster.description}</p>
        `;
        entry.onclick = () => {
            localStorage.setItem('selectedArmyName', roster.name);
            window.location.href = `./pages/army/army.html?id=${roster.name}`;
        };

        armies.appendChild(entry);
    }
  }

  async function createArmy() {
    const army = document.getElementById("army").value;
    const ruleset = document.getElementById("ruleset").value;
    const points = document.getElementById("points").value;
    const name = document.getElementById("name").value;
    const description = document.getElementById("description").value;

    if (!army || !ruleset || !points || !name) {
      alert("Please fill in all required fields.");
      return;
    }

    const rosters = getRosters();
    for (let i = 0; i < rosters.length; ++i) {
        if (rosters[i].name === name) {
            alert("Name must be unique.");
            return;
        }
    }

    let roster = await getRoster(name);
    roster.name = name;
    roster.army = army;
    roster.ruleset = ruleset;
    roster.points = points;
    roster.description = description;
    await putRoster(roster);

    // Reset and close modal
    document.querySelector(".modal").reset?.(); // for future-proofing
    document.getElementById("overlay").style.display = "none";

    console.log('view roster')
    await viewRosters();
  }