
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
    
    whClearDiv(qualifier);

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

const _clear = () => {
    whClearDiv('char');
    whClearDiv('ranged');
    whClearDiv('melee');
    whClearDiv('abilities');
    whClearDiv('keywords');
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
const abilitiesDiv = widgetAbilityInitializeAbilitiesDiv();
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
        widgetAbilityDisplayAbilities(unit);
        displayKeywords(unit);
    });
}
readUnit();