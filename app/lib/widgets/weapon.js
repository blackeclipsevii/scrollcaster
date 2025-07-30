const _displayWeapons = (qualifier, weaponList) => {

    const _limitString = (str, max = 5) => {
        if (typeof str !== 'string')
            return '';
        if (str.toLowerCase().includes('see'))
            return '*';
        return str.length <= max ? str : str.slice(0, max);
    }

    const _getOptionName = (name) => {
        const match = name.match(/<([^>]*)>/);
        const extracted = match ? match[1] : null;
        const modified = name.replace(/<[^>]*>/, '');

        return {
            weaponName: modified,
            optionName: extracted
        };
    }

    const _initializeWeaponsDiv = () => {
        const div = document.getElementById(`${qualifier}-weapons-section`);
        
        let title = document.createElement('div');
        title.id = qualifier + 'WeaponsTitle';

        let header = document.createElement('table');
        header.id = qualifier + 'WeaponsHeader';

        let container = document.createElement('div');
        container.id = qualifier + 'Weapons';

        div.appendChild(title);
        container.appendChild(header);
        div.appendChild(container);
        return div;
    }

    whClearDiv(qualifier);

    const section = document.getElementById(`${qualifier}-weapons-section`);
    if (!weaponList || weaponList.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = '';
    _initializeWeaponsDiv(qualifier);

    const header = document.getElementById(qualifier + "WeaponsHeader");
    header.style.marginTop = '0';
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

        // get the option name out <>
        const nameDiv = document.createElement('div');
        nameDiv.style.justifyContent = 'center';
        const nameObj = _getOptionName(weaponList[i].name);
        const weaponNameH = document.createElement('h3');
        weaponNameH.style.display = 'inline-block';
        weaponNameH.textContent = nameObj.weaponName;
        nameDiv.appendChild(weaponNameH);

        if (nameObj.optionName) {
            const optionName = document.createElement('p');
            optionName.className = 'ability-label';
            optionName.style.backgroundColor = getVar('section-color');
            optionName.style.border = `1px dashed ${getVar('blue-color')}`;
            optionName.style.color = getVar('blue-color');
            optionName.style.marginLeft = '.5em';
            optionName.textContent = nameObj.optionName;
           // optionName.style.color = getVar('white-3');
            nameDiv.appendChild(optionName);
        }

        container.appendChild(nameDiv);

        const profileTable = document.createElement('table');
        profileTable.className = className;

        dataRow = document.createElement("tr");
        headers.forEach(cellData => {
            cell = document.createElement("td");
            cell.className = className;
            if (cellData === 'R' && weaponList[i][lut[cellData]] !== 0 &&
                !weaponList[i][lut[cellData]].startsWith('-')) 
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

const widgetWeaponsDisplayWeapons = (weapons) => {
    if (weapons.length === 0)
        return;

    const ranged = [];
    const melee = [];
    weapons.forEach(weapon => {
        if (weapon.type === 0)
            melee.push(weapon);
        else
            ranged.push(weapon);
    })

    if (ranged.length > 0)
        _displayWeapons('ranged', ranged);
    if (melee.length > 0)
        _displayWeapons('melee', melee);
}