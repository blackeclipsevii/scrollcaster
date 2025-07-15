
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
        title.innerHTML = "Ranged Weapons";
        headers = ['RANGE', 'A', 'HIT', 'W', 'R', 'D'];
        
    } else {        
        className = 'melee-weapon';
        title.innerHTML = "Melee Weapons";
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
            cell.textContent = weaponList[i][lut[cellData]];
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
    
    let title = document.createElement('h3');
    title.id = qualifier + 'WeaponsTitle';

    let header = document.createElement('table');
    header.id = qualifier + 'WeaponsHeader';

    let container = document.createElement('div');
    container.id = qualifier + 'Weapons';

    div.appendChild(title);
    div.appendChild(header);
    div.appendChild(container);
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

    let characteristics = document.createElement('table');
    characteristics.id = 'characteristics';
    characteristics.className = 'characteristics';

    div.appendChild(characteristics);
    return div;
}

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

        displayChars(unit);
        displayWeapons('ranged', unit);
        displayWeapons('melee', unit);
        widgetAbilityDisplayAbilities(unit);
        displayKeywords(unit);
    });
}
readUnit();