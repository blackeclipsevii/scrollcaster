
class RosterSettings {
};

const rosterPage = {
  settings: null,
  _ror: {},
  _armies: [],
  async loadPage(settings) {
    if (!settings)
      settings = new RosterSettings;
    this.settings = settings;
    const thisPage = this;

    const _populateArmies = (data) => {
      if (data) {
        thisPage._armies = data;
      }
      if (!thisPage._armies) {
        console.log('no armies to populate');
        return;
      }

      thisPage._ror = {};
      let loader = document.getElementById("loader-box");
      loader.style.display = 'none';

      let armySelect = document.getElementById("army");
      armySelect.innerHTML = '';
      armySelect.disabled = false;
      thisPage._armies.forEach((army)=> {
        if (!army.includes(' - ')) {
          const option = document.createElement("option");
          option.value = army;
          option.textContent = army;
          armySelect.appendChild(option);
        } else {
          const parts = army.split('-');
          const faction = parts[0].trim();
          const subfaction = parts[1].trim();
          if (thisPage._ror[faction]) {
            thisPage._ror[faction].push(subfaction);
          } else {
            const l = ['Army of Renown (Optional)', subfaction];
            thisPage._ror[faction] = l;
          }
        }
      });

      armySelect.onchange = () => {
        const nameField = document.getElementById('name');
        nameField.placeholder = `Name (Default: ${armySelect.value})`;

        const values = thisPage._ror[armySelect.value.trim()]
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

      armySelect.onchange();
    }

    const setOverlayContents = () => {
      const modal = document.querySelector(".modal");
      modal.innerHTML = `
        <h3 style='margin-top: 0px;'>Create Roster</h3>
        <div style='display: flex'>
          <select id="army"> </select>
          <div id="loader-box" style="margin-left: 1em; margin-right: 2em; width: 1em; height: 1em;">
            <div id="loader" class="loader"></div>
          </div>
        </div>
        <select style='display: none;' id="ror">
        </select>

        <select disabled=true id="ruleset">
          <option value="">Select Ruleset</option>
          <option>GHB 2025-26</option>
        </select>

        <input value="2000" type="number" id="points" placeholder="Points" />
        <input type="text" id="name" placeholder="Name" />
        <textarea id="description" placeholder="Description"></textarea>
      `;
      modal.classList.add('roster-modal');

      const button = document.createElement('button');
      button.className = 'clickable-style full-rectangle-button';
      button.onclick = createArmy;
      button.textContent = 'Create Roster';
      modal.appendChild(button);

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
      if (thisPage._armies.length === 0) {
        await fetchArmies(_populateArmies);
      } else {
        _populateArmies(null);
      }
    });

    function goToRoster(roster) {
      const settings = new BuilderSettings;
      settings.roster = roster;
      dynamicGoTo(settings);
    }

    function displayRoster(roster) {
      if (!roster)
        return;
      
      const armies = document.getElementById("roster-list");
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
        'Update Details': async (e) => {
            const toggle = overlayToggleFactory('flex', () => {
              const modal = document.querySelector(".modal");
              const armyParts = roster.army.split(' - ');
              modal.innerHTML = `
                <h3 style='margin-top: 0px;'>Update Roster Details</h3>
                <div style='display: flex'>
                  <select disabled=true id="army">
                    <option value="">${armyParts[0]}</option>
                  </select>
                </div>
                <select disabled=true style="${armyParts.length === 1 ? 'display: none;' : ''}">
                    <option value="">${armyParts.length > 1 ? armyParts[1] : ''}</option>
                </select>

                <select disabled=true>
                  <option>GHB 2025-26</option>
                </select>

                <input value="2000" type="number" id="replacePoints" placeholder="Points" />
                <input type="text" id="replaceName" placeholder="Name" value="${roster.name}"/>
                <textarea id="replaceDesc" placeholder="Description">${roster.description}</textarea>
              `;
              modal.classList.add('roster-modal');

              const button = document.createElement('button');
              button.className = 'clickable-style full-rectangle-button';
              button.textContent = 'Update Roster';
              button.onclick = async () => {
                let rName = document.getElementById('replaceName').value;
                if (rName.length === 0)
                  rName = roster.name;
                let rPoints = document.getElementById('replacePoints').value;
                if (rPoints.length === 0)
                  rPoints = roster.points;
                const rDesc = document.getElementById('replaceDesc').value;
                roster.name = rName;
                roster.points = Number(rPoints);
                roster.description = rDesc;
                await putRoster(roster);
                disableOverlay();
                await viewRosters();
              };

              modal.appendChild(button);
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
            const toggle = overlayToggleFactory('flex', () => {
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
      const menu = createContextMenu(callbackMap);
      menu.className = 'menu-blob';
      container.appendChild(entry);
      container.appendChild(menu);

      armies.appendChild(container);
    }

    async function createHeaderMenu() {
      const serverVersion = await getServerVersion();
      const bsdataRevision = await getBsDataVersion();
      const bpVersion = await getBattleProfileVersion();

      const right = document.querySelector('.header-right');
      const callbackMap = {
        'About': () => {
            const toggle = overlayToggleFactory('flex', () => {
              const modal = document.querySelector(".modal");
              modal.innerHTML = '';

              const section = document.createElement('p');
              section.innerHTML = `
                <b>Client Version:</b> ${version} <br/>
                <b>Server Version:</b> ${serverVersion} <br/>
                <b>Battle Profile Version:</b> ${bpVersion} <br/>
                <b>BSData:</b> ${bsdataRevision} <br/>
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
          });
          toggle();
        },
        'Clear Favorites': () => {
          const toggle = overlayToggleFactory('flex', () => {
              const modal = document.querySelector(".modal");
              modal.innerHTML = '';

              const section = document.createElement('p');
              section.innerHTML = 'Do you want to clear favorites history?<br/><br/><strong>This cannot be undone.</strong>';

              const button = document.createElement('button');
              button.className = 'full-rectangle-button';
              button.textContent = 'Clear Favorites';
              button.style.backgroundColor = 'red';
              button.onclick = () => {
                clearFavorites();
                disableOverlay();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        },
        'Delete All Rosters': () => {
            const toggle = overlayToggleFactory('flex', () => {
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
                  const armies = document.getElementById("roster-list");
                  armies.innerHTML = '';
                  disableOverlay();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        }
      };

      updateHeaderContextMenu(callbackMap);
    }

    async function viewRosters() {
      createHeaderMenu();

      const armies = document.getElementById("roster-list");
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

      disableOverlay();

      await viewRosters();

      goToRoster(roster);
    }

    _makePage = () => {
      setHeaderTitle('scrollcaster');
      hidePointsOverlay();
      console.log('disable back');
      disableBackButton();
      let oldEle = document.getElementById('roster-list');
      if (oldEle) {
        oldEle.parentElement.removeChild(oldEle);
      }

      const div = document.getElementById('loading-content');
      const button = document.createElement('button');
      button.textContent = '+';
      button.className = 'clickable-style fab';
      button.onclick = toggleOverlay;
      div.appendChild(button);

      const listEle = document.createElement('div');
      listEle.id = 'roster-list';
      listEle.style.padding = '1em';
      div.appendChild(listEle);
    }
    _makePage();
    await viewRosters();
    swapLayout();
  }
};

dynamicPages['rosters'] = rosterPage;

// this is the first page
(() => {
  const settings = new RosterSettings;
  _linkStack['roster'].currentSettings = settings;
  dynamicGoTo(settings);
})();