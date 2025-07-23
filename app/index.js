var _ror = {};
var _armies = []

const _populateArmies = (data) => {
  if (data) {
    _armies = data;
  }
  _ror = {};
  let loader = document.getElementById("loader-box");
  loader.style.display = 'none';

  let armySelect = document.getElementById("army");
  armySelect.innerHTML = '';
  armySelect.disabled = false;
  _armies.forEach((army)=> {
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
}

const setOverlayContents = () => {
  const modal = document.querySelector(".modal");
  modal.innerHTML = `
    <div style='display: flex'>
      <select id="army"> </select>
      <div id="loader-box" style="margin-left: 1em; margin-right: 2em; width: 1em; height: 1em;">
        <div id="loader" class="loader"></div>
      </div>
    </div>
    <select style='display: none;' id="ror">
    </select>

    <select id="ruleset">
      <option value="">Select Ruleset</option>
      <option>GHB 2025-26</option>
    </select>

    <input value="2000" type="number" id="points" placeholder="Points" />
    <input type="text" id="name" placeholder="Name" />
    <textarea id="description" placeholder="Description"></textarea>

    <button class="clickable-style full-rectangle-button" onclick="createArmy()">Create</button>
  `;

  let armySelect = document.getElementById("army");
  armySelect.disabled = true;
  const option = document.createElement("option");
  option.value = '';
  const msgIdx = Math.floor(Math.random() * 6);
  const msgs = [
    'Waking the deadwalkers...',
    'Gathering warpstone...',
    'Reforging...',
    'Mustering reinforcements...',
    'Loading...',
    'Kicking the server...'
  ];
  option.id = 'loading';
  option.textContent = msgs[msgIdx];
  armySelect.appendChild(option);

  const ruleset = document.getElementById("ruleset");
  ruleset.selectedIndex = 1;
}

const toggleOverlay = overlayToggleFactory('flex', async () =>{
  setOverlayContents();
  if (_armies.length === 0) {
    await fetchArmies(_populateArmies);
  } else {
    _populateArmies(null);
  }
});

function goToRoster(roster) {
  goTo(encodeURI(`./pages/army/army.html?id=${roster.id}`));
}

function displayRoster(roster) {
  if (!roster)
    return;
  
  const armies = document.getElementById("army-list");
  const container = document.createElement("div");
  container.className = "clickable-style army-card";
  container.style.overflow = "hidden";
  const entry = document.createElement("div");
  let armyName = roster.army;
  if (armyName.includes(' - ')) {
    armyName = armyName.split(' - ')[1];
  }

  const currentPts = rosterTotalPoints(roster);
  entry.innerHTML = `
  <strong>${roster.name}</strong>
  <span style='margin-left: 1.5em; margin-bottom: 0; background-color: grey;' class='points-label'>${currentPts} points</span> 
  <br/>
  ${armyName}${roster.battleFormation ? ' | ' + roster.battleFormation.name: ''}<br/>
  ${roster.description.length ? roster.description + '<br/>' : ''}
  <div style="display: hidden" class="roster-id" id="${roster.id}"></div>
  `;
  entry.onclick = () => goToRoster(roster);
  entry.style.float = "left";

  const callbackMap = {
    Rename: async (e) => {
        const toggle = overlayToggleFactory('block', () => {
          const modal = document.querySelector(".modal");
          modal.innerHTML = '';

          const section = document.createElement('div');
          section.innerHTML = `
            <input type="text" id="replaceName" placeholder="${roster.name}" />
          `;
          
          const button = document.createElement('button');
          button.className = 'full-rectangle-button';
          button.textContent = 'Update Roster Name';
          button.onclick = async () => {
            const element = document.getElementById('replaceName');
            if (element.value.length !== 0) {
              roster.name = element.value;
              await putRoster(roster);
            }
            disableOverlay();
            await viewRosters();
          };

          modal.appendChild(section);
          modal.appendChild(button);
          const offset = (window.innerWidth - modal.clientWidth) / 2.0;
          modal.style.marginLeft = `${offset}px`;
      });
      toggle();
    },
    
    Duplicate: async (e) => {
      const json = JSON.stringify(roster);
      const clone = JSON.parse(json);
      clone.id = generateId();
      await putRoster(clone);
      displayRoster(clone);
    },

    Delete: async (e) => {
        const toggle = overlayToggleFactory('block', () => {
          const modal = document.querySelector(".modal");
          modal.innerHTML = '';

          const section = document.createElement('p');
          section.innerHTML = `
          Do you want to delete <i><b>${roster.name}</b></i>?<br/><br/>
          <strong>This cannot be undone.</strong>
          `;

          const button = document.createElement('button');
          button.className = 'full-rectangle-button';
          button.textContent = 'Delete Roster';
          button.style.backgroundColor = 'red';
          button.onclick = async () => {
            await deleteRoster(roster.id);
            disableOverlay();
            await viewRosters();
          };

          modal.appendChild(section);
          modal.appendChild(button);
          const offset = (window.innerWidth - modal.clientWidth) / 2.0;
          modal.style.marginLeft = `${offset}px`;
      });
      toggle();
    }
  };
  const menu = createContextMenu(roster.id, roster.id, callbackMap);
  menu.className = 'menu-blob';
  container.appendChild(entry);
  container.appendChild(menu);

  armies.appendChild(container);
}

async function createHeaderMenu() {
  const serverVersion = await getServerVersion();
  const bsdataRevision = await getBsDataVersion();
  const right = document.querySelector('.header-right');
  const callbackMap = {
    'About': () => {
        const toggle = overlayToggleFactory('block', () => {
          const modal = document.querySelector(".modal");
          modal.innerHTML = '';

          const section = document.createElement('p');
          section.innerHTML = `
            <b>Client Version:</b> ${version} <br/>
            <b>Server Version:</b> ${serverVersion} <br/>
            <b>BSData:</b> Game System Revision ${bsdataRevision} <br/>
          `;
          
          const link = document.createElement("a");
          link.textContent = "Contribute to Age of Sigmar 4th BSData (github)";
          link.href = "https://github.com/BSData/age-of-sigmar-4th";
          link.target = "_blank";
          section.appendChild(link);

          const button = document.createElement('button');
          button.className = 'full-rectangle-button';
          button.textContent = 'Close';
          button.onclick = () => {
              disableOverlay();
          };

          modal.appendChild(section);
          modal.appendChild(button);
          const offset = (window.innerWidth - modal.clientWidth) / 2.0;
          modal.style.marginLeft = `${offset}px`;
      });
      toggle();
    },
    'Delete All Rosters': () => {
        const toggle = overlayToggleFactory('block', () => {
          const modal = document.querySelector(".modal");
          modal.innerHTML = '';

          const section = document.createElement('p');
          section.innerHTML = 'Do you want to delete every roster?<br/><br/><strong>This cannot be undone.</strong>';

          const button = document.createElement('button');
          button.className = 'full-rectangle-button';
          button.textContent = 'Delete All Rosters';
          button.style.backgroundColor = 'red';
          button.onclick = () => {
              deleteRosters();
              const armies = document.getElementById("army-list");
              armies.innerHTML = '';
              disableOverlay();
          };

          modal.appendChild(section);
          modal.appendChild(button);
          const offset = (window.innerWidth - modal.clientWidth) / 2.0;
          modal.style.marginLeft = `${offset}px`;
      });
      toggle();
    }
  };
  const menu = createContextMenu(456, 2345, callbackMap);
  const btn = menu.querySelector('.menu-btn');
  btn.style.color = 'white';
  btn.style.top = '.5em';
  menu.style.zIndex = '1000';
  right.appendChild(menu);

}

async function viewRosters() {
  if (!document.querySelector('.menu'))
    createHeaderMenu();

  const armies = document.getElementById("army-list");
  armies.innerHTML = '';

  const rosters = await getRosters();
  for (let i = 0; i < rosters.length; ++i) {
      const roster = await getRoster(rosters[i]);
      displayRoster(roster);
  }
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

  if (!name) {
    name = army;
    if (name.includes(' - ')) {
      name = name.split(' - ')[1];
    }
  }

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
