
const displayChars = (unit) => {
    _clearDiv('char');
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
        cell.style.border = "2px solid black";
        cell.textContent = cellData;
        hdrRow.appendChild(cell);
    });
    tbody.appendChild(hdrRow);

    const dataRow = document.createElement("tr");
    headers.forEach(cellData => {
        const cell = document.createElement("td");
        cell.style.border = "1px solid black";
        cell.textContent = unit[cellData];
        dataRow.appendChild(cell);
    });
    tbody.appendChild(dataRow);
}

const displayWeapons = (qualifier, unit) => {
    
    _clearDiv(qualifier);

    const weaponList = unit[qualifier];

    if (!weaponList || weaponList.length === 0) {
        return;
    }
    
    _initializeWeaponsDiv(qualifier);

    const weapons = document.getElementById(qualifier + "Weapons");
    weapons.style.border = "2px solid black";
    
    const title = document.getElementById(qualifier + "WeaponsTitle");
    let headers;
    const lut = {
        '':'name', 
        'RANGE':'Rng', 
        'A':'Atk',
        'HIT':'Hit',
        'W':'Wnd',
        'R':'Rnd',
        'D':'Dmg',
        'Ability': 'Ability'
    };
    if (qualifier === 'ranged') {
        title.innerHTML = "Ranged Weapons";
        headers = ['', 'RANGE', 'A', 'HIT', 'W', 'R', 'D', 'Ability'];
        
    } else {        
        title.innerHTML = "Melee Weapons";
        headers = ['', 'A', 'HIT', 'W', 'R', 'D', 'Ability'];
    }

    const hdrRow = document.createElement("tr");
    headers.forEach(cellData => {
        const cell = document.createElement("th");
        cell.style.border = "2px solid black";
        cell.textContent = cellData;
        hdrRow.appendChild(cell);
    });
    weapons.appendChild(hdrRow);

    for (let i = 0; i < weaponList.length; ++i) {
        let dataRow = document.createElement("tr");
        let cell = document.createElement("td");

        dataRow = document.createElement("tr");
        headers.forEach(cellData => {
            cell = document.createElement("td");
            cell.style.border = "1px solid black";
            cell.textContent = weaponList[i][lut[cellData]];
            dataRow.appendChild(cell);
        });
        weapons.appendChild(dataRow);
    }
}

const displayAbilities = (unit) => {
    _clearDiv('abilities');

    if (unit.abilities.length === 0)
        return;

    const abilitiesDiv = _initializeAbilitiesDiv();

    for (let i = 0; i < unit.abilities.length; ++i) {
        const ability = unit.abilities[i];
        _newAbilityDiv(ability);
    }
}

const displayKeywords = (unit) => {
    _clearDiv('keywords');
    _initializeKeywordsDiv();
    const keywords = document.getElementById("keywords");
    const title = document.getElementById("keywordTitle");
    
    // Clear existing rows
    title.innerHTML = "Keywords";
    keywords.innerHTML = unit['keywords'].join(', ');
}

const _initializeWeaponsDiv = (qualifier) => {
    let div = document.getElementById(qualifier + 'Div');
    if (!div)
        div = document.createElement("div");
    div.id = qualifier + 'Div';
    
    let title = document.createElement('h3');
    title.id = qualifier + 'WeaponsTitle';

    let weapons = document.createElement('table');
    weapons.id = qualifier + 'Weapons';
    weapons.style.border = "2px solid black";

    div.appendChild(title);
    div.appendChild(weapons);
    return div;
}

const _clearDiv = (qualifier) => {
    const div = document.getElementById(qualifier + 'Div');
    if (div) {
        div.innerHTML = "";
    }
    return div;
}

const _newAbilityDiv = (ability) => {
    const abilitiesDiv = document.getElementById('abilitiesDiv');
    let div = document.createElement('div');
    div.style.width = '333px';
    div.style.padding = '0';
    div.id = ability.name + 'Div';

    let abilityBody = document.createElement('div');
    abilityBody.style.marginTop = '0px';
    abilityBody.style.border = '0px';
    abilityBody.style.paddingTop = '0px';
    abilityBody.style.paddingLeft = '5px';
    abilityBody.style.paddingRight = '5px';
    abilityBody.style.paddingBottom = '5px';
    abilityBody.style.marginLeft = '5px';
    abilityBody.style.marginRight = '5px';

    const addSection = (htmlType, name, prefix, parent, color) => {
        if (ability[name]) {
            let element = document.createElement(htmlType);
            element.class = 'ability' + name;
            element.innerHTML = prefix + ability[name];
            if (color) {
                element.style.backgroundColor = color;
            }
            if (parent) {
                element.style.marginTop = '0';
                element.style.padding = '5px';
                parent.appendChild(element);
            } else {
                abilityBody.appendChild(element);
            }
            return element;
        }
        return null;
    }

    let color = '';
    if (ability.timing) {
        if (ability.timing.includes('Hero')) {
            color = '#AD9B49';
        }
        else if (ability.timing.includes('Movement')) {
            color = '#949494';
        }
        else if (ability.timing.includes('Shooting')) {
            color = '#235D71';
        }
        else if (ability.timing.includes('Charge')) {
            color = '#C47A33';
        }
        else if (ability.timing.includes('Combat')) {
            color = '#892024';
        }
        else if (ability.timing.includes('End')) {
            color = '#6D4784';
        }
    }

    if (color !== '') {
        div.style.border = '2px solid' + color;
        
        let titleBar = document.createElement('div');
        titleBar.style.backgroundColor = color;
        titleBar.style.margin = '0';
        titleBar.style.padding = '0';
        titleBar.style.border = 0;
        addSection('h3', 'timing', '', titleBar, color);
        div.appendChild(titleBar);
    } else {
        div.style.border = '2px solid black';
    }

    addSection('h4', 'name', '');
    addSection('p', 'cost', '<b>Cost:</b> ')
    addSection('p', 'casting value', '<b>Casting Value:</b> ')
    addSection('p', 'declare', '<b>Declare:</b> ');
    addSection('p', 'effect', '<b>Effect:</b> ');
    if (0) {
    const headers = Object.getOwnPropertyNames(ability);
    const abilityTable = document.createElement('table');
    abilityTable.style.border = '2px solid black';
    const hdrRow = document.createElement("tr");
    headers.forEach(cellData => {
        if (cellData !== 'type' && cellData !== 'name' && 
            cellData !== 'timing' && cellData !== 'keywords') {
            const cell = document.createElement("th");
            cell.style.border = "2px solid black";
            cell.textContent = cellData;
            hdrRow.appendChild(cell);
        }
    });
    abilityTable.appendChild(hdrRow);

    let dataRow = document.createElement("tr");
    let cell = document.createElement("td");

    dataRow = document.createElement("tr");
    headers.forEach(cellData => {
        if (cellData !== 'type' && cellData !== 'name'
            && cellData !== 'timing' && cellData !== 'keywords') {
            cell = document.createElement("td");
            cell.style.border = "1px solid black";
            cell.textContent = ability[cellData];
            dataRow.appendChild(cell);
        }
    });

    abilityTable.appendChild(dataRow);

    div.appendChild(abilityTable);
    }

    addSection('h5', 'keywords', 'Keywords: ');
    
    div.appendChild(abilityBody);
    abilitiesDiv.appendChild(div);
    
    const br = document.createElement('br');
    abilitiesDiv.appendChild(br);
}

const _clear = () => {
    _clearDiv('char');
    _clearDiv('ranged');
    _clearDiv('melee');
    _clearDiv('abilities');
    _clearDiv('keywords');
}

const _initializeKeywordsDiv = () => {
    let div = document.getElementById('keywordsDiv');
    if (!div)
        div = document.createElement("div");
    div.id = 'keywordsDiv';

    let kwTitle = document.createElement('h3');
    kwTitle.id = 'keywordTitle';

    let keywords = document.createElement('h5');
    keywords.id = 'keywords';

    div.appendChild(kwTitle);
    div.appendChild(keywords);
    return div;
}

const _initializeAbilitiesDiv = () => {
    let div = document.getElementById('abilitiesDiv');
    if (!div)
        div = document.createElement("div");
    div.id = 'abilitiesDiv';
    
    let title = document.createElement('h3');
    title.id = 'abilitiesTitle';
    title.innerHTML = 'Abilities';

    div.appendChild(title);
    return div;
}

const _initializeCharDiv = () => {
    let div = document.getElementById('charDiv');
    if (!div)
        div = document.createElement("div");
    div.id = 'charDiv';

    let characteristics = document.createElement('table');
    characteristics.id = 'characteristics';
    characteristics.style.border = "2px solid black";

    div.appendChild(characteristics);
    return div;
}

const body = document.getElementById('warscroll');

const charDiv = _initializeCharDiv();
const rangedDiv = _initializeWeaponsDiv('ranged');
const meleeDiv = _initializeWeaponsDiv('melee');
const abilitiesDiv = _initializeAbilitiesDiv();
const keywordsDiv = _initializeKeywordsDiv();

async function readUnit() {
    const params = new URLSearchParams(window.location.search);
    const armyName = params.get('army');
    const unitName = params.get('unit');
    const hdr = document.getElementById('army-header');
    hdr.innerHTML = decodeURI(unitName);
    fetch(`${hostname}:${port}/units?army=${armyName}&name=${unitName}`).
    then(resp => resp.json()).
    then(unit => {
        console.log(JSON.stringify(unit));
        body.appendChild(charDiv);
        body.appendChild(rangedDiv);
        body.appendChild(meleeDiv);
        body.appendChild(abilitiesDiv);
        body.appendChild(keywordsDiv);

        displayChars(unit);
        displayWeapons('ranged', unit);
        displayWeapons('melee', unit);
        displayAbilities(unit);
        displayKeywords(unit);
    });
}
readUnit();