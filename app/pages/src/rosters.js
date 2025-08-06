
class RosterSettings {
};

const rosterPage = {
  settings: null,
  _ror: {},
  _alliances: [],
  async loadPage(settings) {
    if (!settings)
      settings = new RosterSettings;
    this.settings = settings;
    const thisPage = this;

    const _populateArmies = (alliances) => {
      if (alliances) {
        thisPage._alliances = alliances;
      }
      if (!thisPage._alliances) {
        console.log('no armies to populate');
        return;
      }

      thisPage._ror = {};
      let loader = document.getElementById("loader-box");
      loader.style.display = 'none';

      let armySelect = document.getElementById("army");
      armySelect.innerHTML = '';
      armySelect.disabled = false;
      let currentAlliance = '';
      this._alliances.forEach((alliance)=> {
        const army = alliance.name;
        if (alliance.alliance !== currentAlliance) {
          const option = document.createElement("option");
          option.disabled = true;
          option.value = alliance.alliance;
          option.textContent = alliance.alliance;
          option.style.fontWeight = 'bold';
          armySelect.appendChild(option);
          currentAlliance = alliance.alliance; 
        }

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
        rorSelect.onchange = () => {
          let name = '';
          if (rorSelect.value.includes('(Optional)'))
            name = armySelect.value;
          else
            name = rorSelect.value.split(' - ')[1];
          nameField.placeholder = `Name (Default: ${name})`;
        };
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
      option.id = 'loading';
      option.textContent = getLoadingMessage();
      armySelect.appendChild(option);

      const ruleset = document.getElementById("ruleset");
      ruleset.selectedIndex = 1;
    }

    const toggleOverlay = overlayToggleFactory('flex', async () =>{
      setOverlayContents();
      if (thisPage._alliances.length === 0) {
        await fetchArmies(_populateArmies, false);
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
      
      const section = document.getElementById('rosters-section');
      section.style.display = '';
      
      const armies = document.getElementById("rosters-list");
      let armyName = roster.army;
      if (armyName.includes(' - ')) {
        armyName = armyName.split(' - ')[1];
      }
      const item = document.createElement('div');
      item.classList.add('selectable-item');
  
      const left = document.createElement('div');
      left.classList.add('selectable-item-left');
      
      const nameEle = document.createElement('h4');
      nameEle.className = 'selectable-item-name';
      nameEle.textContent = roster.name;
      nameEle.style.padding = '0px';
      nameEle.style.margin = '0px';
      nameEle.style.marginBottom = '.25em';
      left.appendChild(nameEle);

      const armyNameEle = document.createElement('p');
      if (roster.battleFormation)
        armyNameEle.textContent = `${armyName} | ${roster.battleFormation.name}`;
      else
        armyNameEle.textContent = armyName;
      
      armyNameEle.style.fontSize = '12px';
      armyNameEle.style.padding = '0px';
      armyNameEle.style.margin = '0px';
      armyNameEle.style.marginBottom = '.25em';
      left.appendChild(armyNameEle);

      if (roster.description) {
        const descEle = document.createElement('p');
        descEle.className = 'selectable-item-description';
        let desc = roster.description;
        if (desc.length > 40) {
          desc = `${roster.description.slice(0, 37)}...`;
        }
        descEle.innerHTML = `<i>${desc}</i>`;
        descEle.style.fontSize = '12px';
        descEle.style.padding = '0px';
        descEle.style.margin = '0px';
        left.appendChild(descEle);
      }
      const right = document.createElement('div');
      right.classList.add('selectable-item-right');

      const points = document.createElement('span');
      if (rosterTotalPoints(roster) > roster.points)
        points.className = 'points-label';  
      else
        points.className = 'general-label';
      points.style.display = 'inline-block';
      points.textContent = `${roster.points} Points`;
      left.onclick = () => {
        goToRoster(roster);
      }
  
/*
      const currentPts = rosterTotalPoints(roster);
      const entry = document.createElement("div");
      entry.innerHTML = `
      <strong>${roster.name}</strong>
      <span style='margin-left: 1.5em; margin-bottom: 0; background-color: gray;' class='points-label'>${currentPts} points</span> 
      <br/>
      ${armyName}${roster.battleFormation ? ' | ' + roster.battleFormation.name: ''}<br/>
      ${roster.description.length ? roster.description + '<br/>' : ''}
      <div style="display: hidden" class="roster-id" id="${roster.id}"></div>
      `;
*/
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
                <textarea id="replaceDesc" placeholder="Description">${roster.description ? roster.description : ''}</textarea>
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

              const section = document.createElement('p');
              section.innerHTML = `
              Do you want to delete <i><b>${roster.name}</b></i>?<br/><br/>
              <strong>This cannot be undone.</strong>
              `;

              const button = document.createElement('button');
              button.className = 'full-rectangle-button';
              button.textContent = 'Delete Roster';
              button.style.backgroundColor = 'red';
              button.style.color = getVar('white-1');
              button.style.fontWeight = 'bold';
              button.onclick = async () => {
                await deleteRoster(roster.id);
                disableOverlay();
                await viewRosters();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        }
      };
      const menu = createContextMenu(callbackMap);
      menu.className = 'menu-blob';
      right.append(points, menu);
      item.append(left, right);
      armies.appendChild(item);
    }

    async function createHeaderMenu() {
      // const right = document.querySelector('.header-right');
      const callbackMap = {
        'About': async () => {
            const clientVersion = await version.getClientVersion();
            const serverVersion = await version.getServerVersion();
            const bsdataRevision = await version.getBsDataVersion();
            const bpVersion = await version.getBattleProfileVersion();

            const toggle = overlayToggleFactory('flex', async () => {
              const modal = document.querySelector(".modal");
              modal.innerHTML = '';

              const section = document.createElement('p');
              section.innerHTML = `
                  <h3 style='width: fit-content' class='section-title'>About</h3>
                  <div class='section' style='padding: 1em; background-color: ${getVar('hover-color')}; border: 2px solid ${getVar('background-color')}'>
                  
                  <h3 style='padding: 0; margin-top: 0;'>Version</h3>
                    <b>• Client Version:</b> ${clientVersion} <br/>
                    <b>• Server Version:</b> ${serverVersion} <br/>
                    <b>• Battle Profile Version:</b> ${bpVersion} <br/>
                    <b>• BSData Commit:</b> ${bsdataRevision} <br/>
                  <br/>

                  <h3 style='padding: 0; margin-top: 0;'>Contribute: </h3>
                  <a style='color: ${getVar('blue-color')};' 
                  target='_blank' href='https://github.com/blackeclipsevii/scrollcaster'>
                  Contribute to Scrollcaster
                  </a>
                  <br/>
                  <a style='color: ${getVar('blue-color')};' 
                  target='_blank' href='https://github.com/blackeclipsevii/scrollcaster-android'>
                  Contribute to Scrollcaster (Android)
                  </a>
                  <br/>
                  <a style='color: ${getVar('blue-color')};' 
                  target='_blank' href='https://github.com/BSData/age-of-sigmar-4th'>
                  Contribute to BSData
                  </a>
                  <br/>
                  <br/>
                  <div style='display: flex; justify-content: left; align-content: center;'>
                  <div class='kofi-div-nested'>
                      <a target="_blank" href="https://ko-fi.com/scrollcaster">
                      <img src="resources/support_me_on_kofi_beige.webp"></img>
                      </a>
                  </div>
                  </div>
                  <h3 style='padding-top: 0; margin: 0;'> License (GPL v3): </h3> <br/>
                  <div class='license'>
This file is part of Scrollcaster.
<br/><br/>
Copyright (C) 2025 Joseph Decker
<br/>
<br/>
This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, version 3.
<br/>
<br/>
This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
<br/>
<br/>
You should have received a copy of the GNU General Public License along with this program.
If not, see <a href=https://www.gnu.org/licenses/>https://www.gnu.org/licenses/</a>.
                  </div>
                  <br/>
                  <h3 style='padding: 0; margin-top: 0;'> Attribution: </h3>
                  <div class='attribution'>
<div>Icons made by <a href="https://www.flaticon.com/authors/roundicons" title="Roundicons">Roundicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/mayor-icons" title="Mayor Icons">Mayor Icons</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/slidicon" title="Slidicon">Slidicon</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/syahrul-hidayatullah" title="Syahrul Hidayatullah">Syahrul Hidayatullah</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div><div>Icons made by <a href="https://www.flaticon.com/authors/meaicon" title="meaicon">meaicon</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a></div>
                  </div>
                </div>
              `;

              section.style.fontSize = '14px';
              const button = document.createElement('button');
              button.className = 'full-rectangle-button';
              button.textContent = 'Close';
              button.onclick = () => {
                  disableOverlay();
              };

              modal.style.border = `2px solid ${getVar('hover-color')}`;
              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        },
        'Import Roster': async (e) => {
            const toggle  = overlayToggleFactory('block', async () =>{
              const modal = document.querySelector(".modal");

              const section = document.createElement('textarea');
              section.innerHTML = '';
              section.placeholder = 'Paste a list (supported formats: Official App, New Recruit, Scrollcaster).'
              section.style.height = '30em';
              section.style.width = '95%';
              section.style.fontSize = '14px';
              
              //try {
              //  const txt = await navigator.clipboard.readText();
              //  if (ImportRoster.canImport(txt))
              //    section.value = ImportRoster.stripMatchingDelimiters(txt);
              //} catch (err) {
              //}

              const copyButton = document.createElement('button');
              copyButton.className = 'full-rectangle-button';
              copyButton.textContent = 'Import Roster';
              copyButton.onclick = async () => {
                 // try {
                    const roster = await ImportRoster.import(section.value);
                    if (roster) {
                      await putRoster(roster);
                      await viewRosters();
                    }
                 // } catch(e) {
                 //   console.log(`Unable to import roster: ${e}`);
                 // }
                  disableOverlay();
              };

              modal.appendChild(section);
              modal.appendChild(copyButton);
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
              button.style.color = getVar('white-1');
              button.style.fontWeight = 'bold';
              button.onclick = () => {
                clearFavorites();
                disableOverlay();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        },
        'Reset Page Layout': () => {
          const toggle = overlayToggleFactory('flex', () => {
              const modal = document.querySelector(".modal");
              modal.innerHTML = '';

              const section = document.createElement('p');
              section.innerHTML = 'Reset page page layouts to their default settings?<br/><br/><strong>This cannot be undone.</strong>';

              const button = document.createElement('button');
              button.className = 'full-rectangle-button';
              button.textContent = 'Reset Layouts';
              button.style.backgroundColor = 'red';
              button.style.color = getVar('white-1');
              button.style.fontWeight = 'bold';
              button.onclick = () => {
                clearDraggableOrder();
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
              button.style.color = getVar('white-1');
              button.style.fontWeight = 'bold';
              button.onclick = () => {
                  deleteRosters();
                  const armies = document.getElementById("rosters-list");
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

      const armies = document.getElementById("rosters-list");
      armies.innerHTML = '';

      const rosters = await getRosters();
      for (let i = 0; i < rosters.length; ++i) {
          let roster = await getRoster(rosters[i]);
          if (await version.isOutdated(roster)) {
            // update the roster with the latest server data
            const state = rosterState.serialize(roster);
            const newRoster = await rosterState.deserialize(state, roster.id);
            if (newRoster) {
              roster = newRoster;
              putRoster(roster);
            }
          }
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
      //console.log(JSON.stringify(roster));
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
      let rl = document.getElementById('rosters-list');
      if (rl) {
        rl.parentElement.removeChild(rl);
      }

      const sections = ['Rosters'];
      makeLayout(sections);

      setHeaderTitle('Scrollcaster');
      hidePointsOverlay();
      disableBackButton();

      const div = document.getElementById('loading-content');
      const button = document.createElement('div');
      button.textContent = '+';
      button.className = 'clickable-style fab';
      button.onclick = toggleOverlay;
      const inset = new InsetEdges;
      if (inset.bottom) {
          button.style.bottom = `${inset.bottom + 75}px`;
      }

      div.appendChild(button);
      
      const coffee = document.createElement('div');
      coffee.className = 'kofi-div';
      coffee.innerHTML = `
        <a target="_blank" href="https://ko-fi.com/scrollcaster">
          <img src="resources/kofi_symbol-edited.png"></img>
        </a>
      `;
      if (inset.bottom) {
          coffee.style.bottom = `${inset.bottom + 75}px`;
      }
      div.appendChild(coffee);

    }
    _makePage();
    await viewRosters();
    swapLayout();
    initializeDraggable('roster');
  }
};

dynamicPages['rosters'] = rosterPage;

// this is the first page
(async () => {
  const settings = new RosterSettings;
  _linkStack['roster'].currentSettings = settings;
  dynamicGoTo(settings);
})();