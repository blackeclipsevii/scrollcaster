
class WarscrollSettings {
    unit = null;
    local = null;
};

const warscrollPage = {
    settings: null,
    loadPage(settings) {
        if (!settings) {
            throw 'warscroll requires settings';
        }
        this.settings = settings;
        const thisPage = this;
        const _limitString = (str, max = 5) => {
            if (typeof str !== 'string')
                return '';
            if (str.toLowerCase().includes('see'))
                return '*';
            return str.length <= max ? str : str.slice(0, max);
        }

        const displayChars = (unit) => {
            whClearDiv('char');
            _initializeCharDiv();

            const tbody = document.getElementById("characteristics");
            
            // Clear existing rows
            tbody.innerHTML = "";

            if (!unit.Health)
                return;
            
            const headers = ['Move', 'Health', 'Control', 'Save'];

            const hdrRow = document.createElement("tr");
            headers.forEach(cellData => {
                const cell = document.createElement("th");
                cell.className = 'characteristics';
                cell.textContent = cellData;
                hdrRow.appendChild(cell);
            });
            tbody.appendChild(hdrRow);

            const dataRow = document.createElement("tr");
            headers.forEach(cellData => {
                const cell = document.createElement("td");
                cell.className = 'characteristics';
                cell.textContent = unit[cellData];
                dataRow.appendChild(cell);
            });
            tbody.appendChild(dataRow);
        }

        const displayWeapons = (qualifier, unit) => {
            
            whClearDiv(qualifier);

            const weaponList = unit[qualifier];

            const section = document.getElementById(`${qualifier}-weapons-section`);
            if (!weaponList || weaponList.length === 0) {
                section.style.display = 'none';
                return;
            }

            section.style.display = '';
            _initializeWeaponsDiv(qualifier);

            const header = document.getElementById(qualifier + "WeaponsHeader");
            const container = document.getElementById(qualifier + "Weapons");
            const title = document.getElementById(qualifier + "WeaponsTitle");
            let headers;
            const lut = {
                '':'name', 
                'RANGE':'Rng', 
                'A':'Atk',
                'HIT':'Hit',
                'W':'Wnd',
                'R':'Rnd',
                'D':'Dmg'
            };

            let className = null;
            if (qualifier === 'ranged') {
                className = 'ranged-weapon';
                title.innerHTML = `
                <div class='melee-weapons-header'>
                    <img src='../../resources/abShooting.png'></img>
                    <h4>Ranged Weapons</h4>
                </div>
                `;
                headers = ['RANGE', 'A', 'HIT', 'W', 'R', 'D'];
                
            } else {        
                className = 'melee-weapon';
                title.innerHTML = `
                <div class='melee-weapons-header'>
                    <img src='../../resources/abOffensive.png'></img>
                    <h4>Melee Weapons</h4>
                </div>
                `;
                headers = ['A', 'HIT', 'W', 'R', 'D'];
            }

            const hdrRow = document.createElement("tr");
            headers.forEach(cellData => {
                const cell = document.createElement("th");
                cell.className = className;
                cell.textContent = cellData;
                hdrRow.appendChild(cell);
            });
            header.appendChild(hdrRow);

            for (let i = 0; i < weaponList.length; ++i) {
                let dataRow = document.createElement("tr");
                let cell = document.createElement("td");

                const weaponNameH = document.createElement('h3');
                weaponNameH.textContent = weaponList[i].name;
                container.appendChild(weaponNameH);

                const profileTable = document.createElement('table');
                profileTable.className = className;

                dataRow = document.createElement("tr");
                headers.forEach(cellData => {
                    cell = document.createElement("td");
                    cell.className = className;
                    if (cellData === 'R' && weaponList[i][lut[cellData]] !== 0) 
                        cell.textContent = _limitString(`-${weaponList[i][lut[cellData]]}`);
                    else
                        cell.textContent = _limitString(weaponList[i][lut[cellData]]);
                    dataRow.appendChild(cell);
                });
                profileTable.appendChild(dataRow);
                container.appendChild(profileTable);

                if (weaponList[i].Ability && weaponList[i].Ability !== '-') {
                    let abilities = weaponList[i].Ability;
                    abilities = abilities.split(",");
                    for (let i = 0; i < abilities.length; ++i) {
                        const abilityLabel = document.createElement('div');
                        abilityLabel.innerHTML = abilities[i].trim();
                        abilityLabel.className = 'ability-label';
                        container.appendChild(abilityLabel);
                    }
                }

            }
        }

        const displayKeywords = (unit) => {
            whClearDiv('keywords');
            _initializeKeywordsDiv();
            const keywords = document.getElementById("keywords");
            const title = document.getElementById("keywordTitle");
            
            // Clear existing rows
            title.innerHTML = "Keywords";
            keywords.innerHTML = unit['keywords'].join(', ');
        }

        const _initializeWeaponsDiv = (qualifier) => {
            const div = document.getElementById(qualifier + '-weapons-section');
            
            let title = document.createElement('div');
            title.id = qualifier + 'WeaponsTitle';

            let header = document.createElement('table');
            header.id = qualifier + 'WeaponsHeader';

            let container = document.createElement('div');
            container.id = qualifier + 'Weapons';

            div.appendChild(title);
            div.appendChild(container);
            container.appendChild(header);
            return div;
        }

        const _clear = () => {
            whClearDiv('char');
            whClearDiv('ranged');
            whClearDiv('melee');
            whClearDiv('abilities');
            whClearDiv('keywords');
        }

        const _initializeKeywordsDiv = () => {
            const div = document.getElementById('keywords-section');
            div.style.display = '';

            let kwTitle = document.createElement('h3');
            kwTitle.id = 'keywordTitle';

            let keywords = document.createElement('h5');
            keywords.id = 'keywords';

            div.appendChild(kwTitle);
            div.appendChild(keywords);
            return div;
        }

        const _initializeCharDiv = () => {
            let div = document.getElementById('characteristics-section');
            div.style.display = '';

            let characteristics = document.createElement('table');
            characteristics.id = 'characteristics';
            characteristics.className = 'characteristics';

            div.appendChild(characteristics);
            return div;
        }

        async function readUnit() {
            if (thisPage.settings.local) {
                const json = localStorage.getItem(thisPage.settings.local);
                thisPage.settings.unit = JSON.parse(json);
            }

            const _display = (unit) => {
                setHeaderTitle(unit.name);
                displayChars(unit);
                displayWeapons('ranged', unit);
                displayWeapons('melee', unit);
                widgetAbilityDisplayAbilities(unit, unit);
                const abSec = document.getElementById('abilities-section');
                abSec.style.display = '';
                displayKeywords(unit);
            }

            _display(thisPage.settings.unit);
        }
        
        const _makeUnitLayout = () => {
            const sections = [
                'Characteristics', 
                'Ranged Weapons', 
                'Melee Weapons', 
                'Abilities', 
                'Keywords'
            ];
            makeLayout(sections);
            // clear unused elements
            const main = document.getElementById('loading-content');
            const _sections = main.querySelectorAll('.section');
            _sections.forEach(section => {
                const title = section.querySelector('.section-title');
                section.removeChild(title);

                const itemList = section.querySelector('.item-list');
                section.removeChild(itemList);
            })
        }
        _makeUnitLayout();
        disableHeaderContextMenu();
        hidePointsOverlay();
        readUnit();
        window.scrollTo(0, 0);
        swapLayout();
    }
};

dynamicPages['warscroll'] = warscrollPage;