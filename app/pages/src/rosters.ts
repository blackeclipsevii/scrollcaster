import { dynamicPages } from "../../lib/host.js";
import { _linkStack, Settings } from "../../lib/widgets/header.js";
import { dynamicGoTo } from "../../lib/widgets/header.js";
import { version } from "../../lib/RestAPI/version.js";
import { Overlay } from "../../lib/widgets/overlay.js";
import { getLoadingMessage } from "../../lib/RestAPI/fetchWithLoadingDisplay.js";

import { initializeDraggable } from "../../lib/widgets/draggable.js";
import { swapLayout } from "../../lib/widgets/layout.js";
import { updateHeaderContextMenu } from "../../lib/widgets/header.js";
import { clearFavorites } from "../../lib/widgets/favorites.js";
import { rosterTotalPoints } from "../../lib/host.js";

import { makeLayout } from "../../lib/widgets/layout.js";
import { setHeaderTitle } from "../../lib/widgets/header.js";
import { hidePointsOverlay } from "../../lib/widgets/displayPointsOverlay.js";
import { disableBackButton } from "../../lib/widgets/header.js";
import { InsetEdges } from "../../lib/widgets/InsetEdges.js";
import { getVar } from "../../lib/functions/getVar.js";
import { getRoster, getRosters, putRoster, getNewRoster, deleteRoster, deleteRosters } from "../../lib/RestAPI/roster.js";
import { ContextMenu } from "../../lib/widgets/contextMenu.js";
import { generateId } from "../../lib/functions/uniqueIdentifier.js";
import RosterInterf from "../../shared-lib/RosterInterface.js";
import { About } from "../../lib/widgets/About.js";
import RosterStateConverter from "../../lib/functions/import/RosterStateConvertImpl.js";
import { BuilderSettings } from "./builder.js";
import { ImportRoster } from "../../lib/functions/import/importRoster.js";
import { clearDraggableOrder } from "../../lib/widgets/draggable.js";
import { displaySlidebanner, SlideBannerMessageType } from "../../lib/widgets/SlideBanner.js";
import { globalCache } from "../../lib/main.js";

export class RosterSettings implements Settings {
  [name: string]: unknown;
    isHistoric() {
        return true;
    }
    pageName() {
        return 'Roster';
    }
    toUrl() {
        return window.location.origin;
    }
};

interface Alliances {
  name: string;
  alliance: string;
}

const rosterPage = {
  settings: null as RosterSettings | null,
  _ror: {} as {[name: string]: string[]},
  _alliances: [] as Alliances[],
  async loadPage(settings: Settings) {
    if (!settings)
      settings = new RosterSettings;
    this.settings = settings;
    const thisPage = this;

    const _populateArmies = (result: unknown) => {
      const alliances = result as Alliances[] | null;
      if (alliances) {
        thisPage._alliances = alliances;
      }
      if (!thisPage._alliances) {
        console.log('no armies to populate');
        return;
      }

      thisPage._ror = {};
      let loader = document.getElementById("loader-box") as HTMLElement;
      loader.style.display = 'none';

      let armySelect = document.getElementById("army") as HTMLInputElement;
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

       const armySelectOnChange = () => {
        const nameField = document.getElementById('name') as HTMLInputElement;
        nameField.placeholder = `Name (Default: ${armySelect.value})`;

        const values = thisPage._ror[armySelect.value.trim()]
        const rorSelect = document.getElementById("ror") as HTMLSelectElement;
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
      armySelectOnChange();
      armySelect.onchange = armySelectOnChange;
    }

    const hideCreateHint = (isLoading: boolean) => {
      const hintClass = 'create-hint';
      const contentId = isLoading ? 'loading-content' : 'visible-content';
      const content = document.getElementById(contentId) as HTMLDivElement;
      const section = content.querySelector(`.${hintClass}`);
      if (section && section.parentElement) {
        section.parentElement.removeChild(section);
      }
    }

    const displayCreateHint = (isLoading: boolean) => {
      const hintClass = 'create-hint';
      const contentId = isLoading ? 'loading-content' : 'visible-content';
      const content = document.getElementById(contentId) as HTMLElement;
      let section = content.querySelector(`.${hintClass}`) as HTMLElement;
      if (section) {
        section.style.display = 'flex';
        return;
      }
      section = document.createElement('div') as HTMLElement;
      section.className = 'section';
      section.classList.add(hintClass);
      section.style.display = 'flex';
      section.style.justifyContent = 'center';
      section.style.alignContent = 'center';
      section.style.border = `2px solid ${getVar('hover-color')}`
      const p = document.createElement('p');
      p.textContent = `Tap the + button to create your first Roster.`
      //p.style.marginLeft = '1em';
      p.style.color = getVar('white-1');
      section.append(p);
      content.appendChild(section);
    }

    const setOverlayContents = () => {
      const modal = document.querySelector(".modal") as HTMLElement;
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

      let armySelect = document.getElementById("army") as HTMLInputElement;
      armySelect.disabled = true;
      const option = document.createElement("option");
      option.value = '';
      option.id = 'loading';
      option.textContent = getLoadingMessage();
      armySelect.appendChild(option);

      const ruleset = document.getElementById("ruleset") as HTMLSelectElement;
      ruleset.selectedIndex = 1;
    }

    const toggleOverlay = Overlay.toggleFactory('flex', async () =>{
      setOverlayContents();
      if (thisPage._alliances.length === 0) {
        const armies = await globalCache?.getArmies();
        _populateArmies(armies);
      } else {
        _populateArmies(null);
      }
    });

    function goToRoster(roster: RosterInterf) {
      const settings = new BuilderSettings(roster);
      dynamicGoTo(settings);
    }

    function displayRoster(roster: RosterInterf) {
      if (!roster)
        return;
      
      const armies = document.getElementById("rosters-list") as HTMLElement;
      let armyName = roster.army;
      if (armyName.includes(' - ')) {
        armyName = armyName.split(' - ')[1];
      }
      const item = document.createElement('div');
      item.classList.add('selectable-item');
      item.id = roster.id;
  
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
      points.style.margin = '0';
      points.textContent = `${roster.points} Points`;
      item.onclick = () => {
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
        'Update Details': async () => {
            const toggle = Overlay.toggleFactory('flex', () => {
              const modal = document.querySelector(".modal") as HTMLElement;
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
                let element = document.getElementById('replaceName') as HTMLInputElement;
                let rName = element.value;
                if (rName.length === 0)
                  rName = roster.name;

                element = document.getElementById('replacePoints') as HTMLInputElement;
                let rPoints: string | number = element.value;
                if (rPoints.length === 0)
                  rPoints = roster.points;

                element = document.getElementById('replaceDesc') as HTMLInputElement;
                const rDesc = element.value;
                roster.name = rName;
                roster.points = Number(rPoints);
                roster.description = rDesc;
                await putRoster(roster);
                Overlay.disable();
                await viewRosters();
              };

              modal.appendChild(button);
          });
          toggle();
        },
        Duplicate: async () => {
          const labelCopy = (str: string) => {
            const match = str.match(/\((\d+)\)$/);
            if (match) {
              const num = parseInt(match[1], 10);
              return str.replace(/\(\d+\)$/, `(${num + 1})`);
            } else {
              return `${str} (1)`;
            }
          }

          const json = JSON.stringify(roster);
          const clone = JSON.parse(json);
          clone.id = generateId();
          clone.name = labelCopy(clone.name);
          await putRoster(clone);
          displayRoster(clone);
        },
        Delete: async () => {
            const toggle = Overlay.toggleFactory('flex', () => {
              const modal = document.querySelector(".modal") as HTMLElement;

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
                Overlay.disable();
                await viewRosters();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        }
      };
      const menu = ContextMenu.create(callbackMap);
      menu.className = 'menu-blob';
      right.append(points, menu);
      item.append(left, right);
      armies.appendChild(item);
    }

    async function createHeaderMenu() {
      const callbackMap = {
        'About': async () => {
            const toggle = Overlay.toggleFactory('flex', async () => {
              const modal = document.querySelector(".modal") as HTMLElement;
              modal.innerHTML = '';

              const content = await About.get();

              const button = document.createElement('button');
              button.className = 'full-rectangle-button';
              button.textContent = 'Close';
              button.onclick = () => {
                  Overlay.disable();
              };

              modal.style.border = `2px solid ${getVar('hover-color')}`;
              modal.appendChild(content);
              modal.appendChild(button);
          });
          toggle();
        },
        'Import Roster': async () => {
            const toggle  = Overlay.toggleFactory('block', async () =>{
              const modal = document.querySelector(".modal") as HTMLElement;

              const section = document.createElement('textarea');
              section.innerHTML = '';
              section.placeholder = 'Paste a list'
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
                  const roster = await ImportRoster.import(section.value);
                  Overlay.disable();
                  
                  if ((roster as Error).message) {
                    displaySlidebanner((roster as Error).message, SlideBannerMessageType.Bad);
                  } else {
                    const asRoster = roster as RosterInterf;
                    // displaySlidebanner(`${asRoster.name} imported`, SlideBannerMessageType.Good);
                    asRoster.description = 'Imported';
                    await putRoster(asRoster);
                    goToRoster(asRoster);
                  }
              };

              modal.appendChild(section);
              modal.appendChild(copyButton);
          });
          toggle();
        },
        'Clear Favorites': () => {
          const toggle = Overlay.toggleFactory('flex', () => {
              const modal = document.querySelector(".modal") as HTMLElement;
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
                Overlay.disable();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        },
        'Reset Page Layout': () => {
          const toggle = Overlay.toggleFactory('flex', () => {
              const modal = document.querySelector(".modal") as HTMLElement;
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
                Overlay.disable();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        },
        'Delete All Rosters': () => {
            const toggle = Overlay.toggleFactory('flex', () => {
              const modal = document.querySelector(".modal") as HTMLElement;
              modal.innerHTML = '';

              const section = document.createElement('p');
              section.innerHTML = 'Do you want to delete every roster?<br/><br/><strong>This cannot be undone.</strong>';

              const button = document.createElement('button');
              button.className = 'full-rectangle-button';
              button.textContent = 'Delete All Rosters';
              button.style.backgroundColor = 'red';
              button.style.color = getVar('white-1');
              button.style.fontWeight = 'bold';
              button.onclick = async () => {
                  deleteRosters();
                  const armies = document.getElementById("rosters-list") as HTMLElement;
                  armies.innerHTML = '';
                  await viewRosters();
                  Overlay.disable();
              };

              modal.appendChild(section);
              modal.appendChild(button);
          });
          toggle();
        }
      };

      updateHeaderContextMenu(callbackMap);
    }

    async function viewRosters(isLoading=false) {
      createHeaderMenu();

      const section = document.getElementById('rosters-section') as HTMLDivElement;
      const armies = document.getElementById("rosters-list") as HTMLElement;
      armies.innerHTML = '';

      const rosters = await getRosters();
      for (let i = 0; i < rosters.length; ++i) {
          let isValid = true;
          let roster = await getRoster(rosters[i]);
          if (await version.isOutdated(roster)) {
            isValid = false;
            // update the roster with the latest server data
            try {
              const rsc = new RosterStateConverter();
              const state = rsc.serialize(roster);
              const newRoster = await rsc.deserialize(state, roster.id);
              if (newRoster) {
                isValid = true;
                roster = newRoster;
                putRoster(roster);
              }
            } catch(e) {
              console.log(`Exception occured while trying to migrate roster to lastest version: ${e}`);
            }
          }
          if (isValid)
            displayRoster(roster);
      }

      if (rosters.length === 0) {
        section.style.display = 'none';
        displayCreateHint(isLoading);
      } else {
        hideCreateHint(isLoading);
        section.style.display = '';
      }
    }

    async function createArmy() {
      const getValue = (name: string): string | null =>{
        const ele = document.getElementById(name) as HTMLInputElement | HTMLSelectElement | null;
        if (!ele)
          return null;
        return ele.value;
      }
      let army = getValue("army");
      const ror = getValue("ror");
      if (ror && !ror.includes('Optional')) {
        army = ror;
      }

      const ruleset = getValue("ruleset");
      const points = getValue("points");
      let name = getValue("name");
      const description = getValue("description");

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

      Overlay.disable();

      await viewRosters();

      goToRoster(roster);
    }

    const _makePage = () => {
      let rl = document.getElementById('rosters-list');
      if (rl && rl.parentElement) {
        rl.parentElement.removeChild(rl);
      }

      const sections = ['Rosters'];
      makeLayout(sections);

      setHeaderTitle('Scrollcaster');
      hidePointsOverlay();
      disableBackButton();

      const div = document.getElementById('loading-content') as HTMLDivElement;
      const button = document.createElement('div');
      button.className = 'clickable-style fab';
      button.innerHTML = `
        <div class='plus-wrapper'>
          <img class="navigation-img" src="resources/${getVar('plus-icon')}"></img>
        </div>
      `
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
    await viewRosters(true);
    swapLayout();
    initializeDraggable('roster');
  }
};

dynamicPages['rosters'] = rosterPage;