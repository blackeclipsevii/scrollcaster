
const widgetsAbilityNewAbilityDiv = (ability) => {
    const abilitiesDiv = document.getElementById('abilities-section');
    let div = document.createElement('div');
    div.className = 'ability-container';
    div.id = ability.name + 'Div';
    const radius = getVar('border-radius');

    let abilityBody = document.createElement('div');
    abilityBody.className = 'ability-body';
    abilityBody.style.borderBottomLeftRadius = radius;
    abilityBody.style.borderBottomRightRadius = radius;

    const addSection = (htmlType, name, prefix, parent) => {
        if (ability[name]) {
            let element = document.createElement(htmlType);
            element.className = 'ability' + name;
            element.innerHTML = prefix + ability[name];

            if (parent) {
                parent.appendChild(element);
            } else {
                abilityBody.appendChild(element);
            }
            return element;
        }
        return null;
    }

    if (!ability.timing)
        ability.timing = 'Passive';

    let invertPng = false;
    let headerFontColor = getVar('header-font-color');
    let color = getVar('section-font-color');
    let icon = '../../resources/abSpecial.png';
    let cssColor = 'gray';
    if (ability.metadata && ability.metadata.color) {
        cssColor = ability.metadata.color.toLowerCase();
    }

    let theColor = getVar(`${cssColor}-ability`);
    if (theColor && theColor.length > 0)
        color = theColor;
    
    theColor = getVar(`${cssColor}-ability-header-font-color`);
    if (theColor && theColor.length > 0)
        headerFontColor = theColor;

    invertPng = getVar(`${cssColor}-invert-png`) ? true : false;

    if (ability.metadata && ability.metadata.type) {
        let type = ability.metadata.type;
        icon = `../../resources/ab${type}.png`
    }

    div.style.borderRadius = radius;
    div.style.backgroundColor = color;
    div.style.border = `1px solid ${color}`;
    let titleBar = document.createElement('div');
    titleBar.className = 'ability-header';
    const img = document.createElement('img');
    img.src = icon;
    img.className = 'ability-icon';
    img.style.display = 'inline-block';
    if (invertPng) {
        img.classList.add('invert-img');
    }
    titleBar.appendChild(img);
    addSection('h3', 'timing', '', titleBar, color);
    titleBar.style.color = headerFontColor;
    div.appendChild(titleBar);

    addSection('h4', 'name', '');
    const abilityName = abilityBody.querySelector('.abilityname');
    if (color !== '')
        abilityName.style.paddingTop = '.5em';

    addSection('p', 'cost', '<b>Cost:</b> ')
    addSection('p', 'casting value', '<b>Casting Value:</b> ')
    addSection('p', 'chanting value', '<b>Chanting Value:</b> ')
    addSection('p', 'declare', '<b>Declare:</b> ');
    addSection('p', 'effect', '<b>Effect:</b> ');
    addSection('h5', 'keywords', 'Keywords: ');
    const keywords = abilityBody.querySelector('.abilitykeywords');
    if (keywords) {
        keywords.style.paddingBottom = '0px';
        keywords.style.marginBottom = '.5em';
    }
    div.appendChild(abilityBody);
    abilitiesDiv.appendChild(div);
    
    const br = document.createElement('br');
    abilitiesDiv.appendChild(br);
}

const widgetAbilityInitializeAbilitiesDiv = (name=null) => {
    const isString = (value) => {
        return typeof value === 'string' || value instanceof String;
    }

    let section = document.getElementById('abilities-section');
    
    let title = document.createElement('h3');
    title.className = 'abilitiesTitle';
    title.innerHTML = isString(name) ? name : 'Abilities';

    section.appendChild(title);
    return section;
}

const widgetAbilityDisplayAbilities = (unit, title='Abilities') => {
    whClearDiv('abilities-section');

    const abilitiesDiv = widgetAbilityInitializeAbilitiesDiv(title);

    const doIt = (singleUnit) => {
        if (singleUnit.abilities.length === 0)
            return;

        for (let i = 0; i < singleUnit.abilities.length; ++i) {
            const ability = singleUnit.abilities[i];
            widgetsAbilityNewAbilityDiv(ability);
        }

        if (singleUnit.optionSet) {
            singleUnit.optionSet.forEach(set => {
                if (set.selection && set.selection.abilities.length > 0) {
                    set.selection.abilities.forEach(ability => {
                        widgetsAbilityNewAbilityDiv(ability);
                    });
                }
            });
        }
    };
    
    if (Array.isArray(unit)) {
        unit.forEach(u => doIt(u))
    } else {
        doIt(unit);
    }
}
