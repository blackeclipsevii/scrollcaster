var _ror = {};
var _armies = []
const toggleOverlay = overlayToggleFactory('flex', () =>{
  if (_armies.length === 0)
  fetch(`${endpoint}/armies`).
  then(resp => resp.json()).
  then(armies => {
    _armies = armies;
    _ror = {};
    let armySelect = document.getElementById("army");
    armies.forEach((army)=> {
      console.log(army);
      if (!army.includes(' - ')) {
        const option = document.createElement("option");
        option.value = army;
        option.textContent = army;
        armySelect.appendChild(option);
      } else {
        const parts = army.split('-');
        const faction = parts[0].trim();
        const subfaction = parts[1].trim();
        if (_ror[faction]) {
          _ror[faction].push(subfaction);
        } else {
          const l = ['Army of Renown (Optional)', subfaction];
          _ror[faction] = l;
        }
      }
    });
    
    armySelect.onchange = () => {
      const values = _ror[armySelect.value.trim()]
      const rorSelect = document.getElementById("ror");
      if (values && values.length > 0) {
        rorSelect.disabled = false;
        rorSelect.style.display = '';
        rorSelect.innerHTML = '';
        values.forEach(value => {
          const option = document.createElement("option");
          option.value = `${armySelect.value} - ${value}`;
          option.textContent = value;
          rorSelect.appendChild(option);
        });
      } else {
        rorSelect.innerHTML = '';
        rorSelect.style.display = 'none';
      }
    };
  });
});

function goToRoster(roster) {
  window.location.href = encodeURI(`./pages/army/army.html?id=${roster.id}`);
}

function displayRoster(roster) {
  if (!roster)
    return;
  
  const armies = document.getElementById("army-list");
  const container = document.createElement("div");
  container.className = "clickable-style army-card";
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
  menu.className = 'menu-blob';
  container.appendChild(entry);
  container.appendChild(menu);

  armies.appendChild(container);
}

function setupVersion() {
  const element = document.getElementById('version');
  element.textContent = `${version}`
}

async function viewRosters() {
  setupVersion();
  addOverlayListener();

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
  clone.id = generateId();
  await putRoster(clone);
  displayRoster(clone);
}

async function deleteRosterCallback(e) {
  const menuWrapper = e.closest(`.menu-wrapper`);
  const idxDiv = menuWrapper.querySelector(".idx");
  const id = idxDiv.textContent;
  await deleteRoster(id);
  await viewRosters();
}

async function createArmy() {
  let army = document.getElementById("army").value;
  const ror = document.getElementById("ror").value;
  if (ror && !ror.includes('Optional')) {
    army = ror;
  }

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

  let roster = await getNewRoster(army);
  console.log(JSON.stringify(roster));
  roster.name = name;
  roster.id = generateId();
  roster.ruleset = ruleset;
  roster.points = points;
  roster.description = description
  await putRoster(roster);

  // Reset and close modal
  document.querySelector(".modal").reset?.(); // for future-proofing
  document.getElementById("overlay").style.display = "none";

  await viewRosters();

  goToRoster(roster);
}
