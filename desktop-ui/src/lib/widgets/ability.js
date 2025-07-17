
const widgetsAbilityNewAbilityDiv = (ability) => {
    const abilitiesDiv = document.getElementById('abilities-section');
    let div = document.createElement('div');
    div.className = 'ability-container';
    div.id = ability.name + 'Div';

    let abilityBody = document.createElement('div');
    abilityBody.className = 'ability-body';

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
        // to-do just match to ability color
        if (ability.timing.includes('Hero'))
            color = '#AD9B49';
        else if (ability.timing.includes('Movement'))
            color = '#949494';
        else if (ability.timing.includes('Shooting'))
            color = '#235D71';
        else if (ability.timing.includes('Charge'))
            color = '#C47A33';
        else if (ability.timing.includes('Combat'))
            color = '#892024';
        else if (ability.timing.includes('End'))
            color = '#6D4784';
        else
            color = '#949494';
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
    addSection('p', 'chanting value', '<b>Chanting Value:</b> ')
    addSection('p', 'declare', '<b>Declare:</b> ');
    addSection('p', 'effect', '<b>Effect:</b> ');
    addSection('h5', 'keywords', 'Keywords: ');
    
    div.appendChild(abilityBody);
    abilitiesDiv.appendChild(div);
    
    const br = document.createElement('br');
    abilitiesDiv.appendChild(br);
}

const widgetAbilityInitializeAbilitiesDiv = () => {
    let section = document.getElementById('abilities-section');
    
    let title = document.createElement('h3');
    title.className = 'abilitiesTitle';
    title.innerHTML = 'Abilities';

    section.appendChild(title);
    return section;
}

const widgetAbilityDisplayAbilities = (unit) => {
    whClearDiv('abilities-section');

    const abilitiesDiv = widgetAbilityInitializeAbilitiesDiv();

    const doIt = (singleUnit) => {
        if (singleUnit.abilities.length === 0)
            return;

        for (let i = 0; i < singleUnit.abilities.length; ++i) {
            const ability = singleUnit.abilities[i];
            widgetsAbilityNewAbilityDiv(ability);
        }
    };
    
    if (Array.isArray(unit)) {
        unit.forEach(u => doIt(u))
    } else {
        doIt(unit);
    }
}
