
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

function goToRoster(roster) {
  window.location.href = encodeURI(`./pages/army/army.html?id=${roster.id}`);
}

function displayRoster(roster) {
  if (!roster)
    return;
  
  const armies = document.getElementById("army-list");
  const container = document.createElement("div");
  container.className = "army-card";
  container.style.overflow = "hidden";
  const entry = document.createElement("div");
  entry.innerHTML = `
  <strong>${roster.name}</strong><br/>
  ${roster.army} | ${roster.ruleset} | ${roster.points} pts
  <p>${roster.description}</p>
  <div style="display: hidden" class="roster-id" id="${roster.id}"></div>
  `;
  entry.onclick = () => goToRoster(roster);
  entry.style.float = "left";

  const menu = createContextMenu(roster.id, roster.id, 'RosterCallback');
  container.appendChild(entry);
  container.appendChild(menu);

  armies.appendChild(container);
}

async function viewRosters() {
  const overlay = document.getElementById('overlay');
  overlay.addEventListener('click', function(event) {
    if (event.target === overlay) {
      overlay.style.display = 'none';
    }
  });
  
  const armies = document.getElementById("army-list");
  armies.innerHTML = '';

  const rosters = await getRosters();
  for (let i = 0; i < rosters.length; ++i) {
      const roster = await getRoster(rosters[i]);
      displayRoster(roster);
  }
}

async function duplicateRosterCallback(e) {
  const menuWrapper = e.closest(`.menu-wrapper`);
  const idxDiv = menuWrapper.querySelector(".idx");
  const id = idxDiv.textContent;
  const originalRoster = await getRoster(id);
  if (originalRoster.id !== id)
    console.log(`Could not retrieve roster ${id}`)
  const json = JSON.stringify(originalRoster);
  const clone = JSON.parse(json);
  clone.id = generateId(16);
  await putRoster(clone);
  displayRoster(clone);
}

async function deleteRosterCallback(e) {
  const menuWrapper = e.closest(`.menu-wrapper`);
  const idxDiv = menuWrapper.querySelector(".idx");
  const id = idxDiv.textContent;
  deleteRoster(id);
  await viewRosters();
}

  async function createArmy() {
    const army = document.getElementById("army").value;
    const ruleset = document.getElementById("ruleset").value;
    const points = document.getElementById("points").value;
    let name = document.getElementById("name").value;
    const description = document.getElementById("description").value;

    if (!army || !ruleset || !points) {
      alert("Please fill in all required fields.");
      return;
    }

    if (!name)
      name = army;

    let roster = await getRoster('this is a bad roster');
    console.log(JSON.stringify(roster));
    roster.name = name;
    roster.id = generateId(16);
    roster.army = army;
    roster.ruleset = ruleset;
    roster.points = points;
    roster.description = description;
    await putRoster(roster);

    // Reset and close modal
    document.querySelector(".modal").reset?.(); // for future-proofing
    document.getElementById("overlay").style.display = "none";

    await viewRosters();

    goToRoster(roster);
  }