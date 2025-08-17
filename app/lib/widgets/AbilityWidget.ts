import { getVar } from "../functions/getVar.js";
import { whClearDiv } from "./helpers.js";
import { DYNAMIC_WARSCROLL } from "../host.js";
import UnitInterf from "../../shared-lib/UnitInterface.js";
import AbilityInterf from "../../shared-lib/AbilityInterface.js";
import UpgradeInterf from "../../shared-lib/UpgradeInterface.js";

export const AbilityWidget = {
    _newAbilityDiv(ability: AbilityInterf) {
        const abilitiesDiv = document.getElementById('abilities-section') as HTMLElement | null;
        if (!abilitiesDiv)
            return;
        
        let abilityBody = document.createElement('div');
        abilityBody.className = 'ability-body';

        const addSection = (htmlType: string, name: string, prefix: string, parent?: HTMLElement) => {
            const lookableAbility = ability as unknown as {[name: string]: string};
            if (lookableAbility[name]) {
                let element = document.createElement(htmlType);
                element.className = 'ability' + name;
                element.innerHTML = prefix + lookableAbility[name];

                if (parent) {
                    parent.appendChild(element);
                } else {
                    abilityBody.appendChild(element);
                }
                return element;
            }
            return null;
        }

        let cssColor = 'gray';
        if (ability.metadata && ability.metadata.color) {
            cssColor = ability.metadata.color.toLowerCase();
        }

        let theColor = getVar(`${cssColor}-ability`);
        let color = getVar('gray-ability');
        if (theColor && theColor.length > 0)
            color = theColor;
        
        theColor = getVar(`${cssColor}-ability-header-font-color`);
        let headerFontColor = getVar('header-font-color');
        if (theColor && theColor.length > 0)
            headerFontColor = theColor;

        let icon = `../../resources/${getVar('ab-special')}`;
        if (ability.metadata && ability.metadata.type) {
            let type = ability.metadata.type;
            icon = `../../resources/${getVar(`ab-${type.toLowerCase()}`)}`
        }

        const img = document.createElement('img');
        img.src = icon;
        img.className = 'ability-icon';
        img.style.display = 'inline-block';
        
        const invertPng = getVar(`${cssColor}-invert-png`) ? false : true;
        if (invertPng) {
            img.classList.add('invert-img');
        }

        const titleBar = document.createElement('div');
        titleBar.className = 'ability-header';
        titleBar.appendChild(img);
        addSection('h3', 'timing', '', titleBar);//, color);
        titleBar.style.color = headerFontColor;

        addSection('h4', 'name', '');
        const abilityName = abilityBody.querySelector('.abilityname') as HTMLElement;
        if (color !== '')
            abilityName.style.paddingTop = '.5em';

        let costAdded = addSection('p', 'casting value', '<b>Casting Value:</b> ')
        if (!costAdded)
            costAdded = addSection('p', 'chanting value', '<b>Chanting Value:</b> ')
        if (!costAdded)
            addSection('p', 'cost', '<b>Cost:</b> ')
        addSection('p', 'declare', '<b>Declare:</b> ');
        addSection('p', 'effect', '<b>Effect:</b> ');
        addSection('h5', 'keywords', 'Keywords: ');
        
        const div = document.createElement('div');
        div.className = 'ability-container';
        div.style.backgroundColor = color;
        div.style.borderColor = color;
        div.appendChild(titleBar);
        div.appendChild(abilityBody);
        const observer = new ResizeObserver(entries => {
            const maxWidth = 450;
            for (let entry of entries) {
                const currentWidth = entry.contentRect.width;
                if (currentWidth >= maxWidth) {
                    div.style.margin = '.5em';
                } else {
                    div.style.margin = '';
                }
            }
        });

        observer.observe(div);
        abilitiesDiv.appendChild(div);
    },
    _initializeAbilitiesDiv(name: string | unknown | null =null) {
        const isString = (value: string | unknown): boolean => {
            return typeof value === 'string' || value instanceof String;
        }

        let section = document.getElementById('abilities-section') as HTMLElement;
        let title = section.querySelector('.section-title') as HTMLElement | null;

        if (!title) {
            title = document.createElement('h3');
            title.innerHTML = isString(name) ? name as string : 'Abilities';
            section.appendChild(title);
        }
        
        return section;
    },
    display(unit: UnitInterf | UnitInterf[] | UpgradeInterf | UpgradeInterf[], title: string ='Abilities'){
        whClearDiv('abilities-section');

        const abilitiesDiv = this._initializeAbilitiesDiv(title);

        const doIt = (singleUnit: UnitInterf | UpgradeInterf) => {
            if (singleUnit.abilities.length === 0)
                return;

            for (let i = 0; i < singleUnit.abilities.length; ++i) {
                const ability = singleUnit.abilities[i];
                this._newAbilityDiv(ability);
            }

            if ((singleUnit as UnitInterf).optionSets) {
                (singleUnit as UnitInterf).optionSets.forEach(set => {
                    // disable dynamic warscroll content
                    if (DYNAMIC_WARSCROLL && set.selection) {
                        set.selection.abilities.forEach(ability => {
                            this._newAbilityDiv(ability);
                        });
                    }
                    else {
                        // none selected
                        const options = Object.values(set.options);
                        options.forEach(option => {
                            option.abilities.forEach(ability => {
                                this._newAbilityDiv(ability);
                            });
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
}