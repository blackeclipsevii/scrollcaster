import { disableHeaderContextMenu, getPageRouter, setHeaderTitle } from "@/lib/widgets/header";
import { makeLayout, swapLayout } from "@/lib/widgets/layout";
import { displayTacticsOverlay } from "@/lib/widgets/displayTacticsOverlay";
import { initializeFavoritesList, newFavoritesCheckbox, newFavoritesOnChange } from "@/lib/widgets/favorites";
import { putRoster } from "@/lib/RestAPI/roster";
import { initializeDraggable } from "@/lib/widgets/draggable";
import { getGlobalCache } from "@/lib/RestAPI/LocalCache";

import Settings from "./settings/Settings";
import TacticsSettings from "./settings/TacticsSettings";

const tacticsPage = {
    settings: null as TacticsSettings | null,
    async loadPage(settings: Settings) {
        if (!settings)
            settings = new TacticsSettings;

        this.settings = settings as TacticsSettings;

        const thisPage = this;

        const _makeTacticLayout = () => {
            const sections = [
                'Battle Tactic Cards'
            ];
            makeLayout(sections);
        }
        
        async function loadTactics() {
            const tacticList = document.getElementById('battle-tactic-cards-list') as HTMLElement;
            const section = document.getElementById('battle-tactic-cards-section') as HTMLElement;
            section.style.display = 'block';
        
            const tactics = await getGlobalCache()?.getTactics();
            if (!tactics)
                return;

            tactics.forEach(tacticCard => {
                let currentPosition = -1;
                if (thisPage.settings!!.roster) {
                    thisPage.settings!!.roster.battleTacticCards.forEach((bt, idx) => {
                        if (tacticCard.name === bt.name)
                            currentPosition = idx;
                    });
                }
    
                const item = document.createElement('div');
                item.classList.add('selectable-item');
                if (!getPageRouter()?.inCatalog())
                    item.classList.add('not-added');
    
                const left = document.createElement('div');
                left.classList.add('selectable-item-left');
    
                const nameEle = document.createElement('h4');
                nameEle.className = 'selectable-item-name';
                nameEle.textContent = tacticCard.name;
                nameEle.style.padding = '0px';
                nameEle.style.margin = '0px';
                left.appendChild(nameEle);

                
                const typeEle = document.createElement('span');
                typeEle.className = 'selectable-item-type ability-label';
                typeEle.style.display = 'inline-block';
                typeEle.textContent = 'Battle Tactic Card';
                left.appendChild(typeEle);
        
    
                // Clicking the container navigates to details
                item.addEventListener('click', () => {
                    displayTacticsOverlay(tacticCard);
                });
    
                const right = document.createElement('div');
                right.classList.add('selectable-item-right');
    
                const onchange = newFavoritesOnChange(tacticList, item, tacticCard.name);

                const toggleDisableUnchecked = (disabled: boolean) => {
                    const checkboxes = section.querySelectorAll('.tactic-checkbox') as NodeListOf<HTMLInputElement>;
                    checkboxes.forEach(box => {
                        if (!box.checked) {
                            box.disabled = disabled;
                        }
                    });
                }
    
                // tactic card id not unique? doesn't exist?
                let heart = null;
                if (thisPage.settings!!.roster) {
                    const tacticCheckbox = document.createElement('input');
                    tacticCheckbox.type = 'checkbox';
                    tacticCheckbox.classList.add('tactic-checkbox');
                    tacticCheckbox.style.transform = 'scale(1.5)';
                    const notAdded = 'not-added';
                    const added = 'added';
                    if (currentPosition !== -1) {
                        item.classList.remove(notAdded);
                        item.classList.add(added);
                        tacticCheckbox.checked = true;
                    }

                    tacticCheckbox.onclick = (e) =>{
                        e.stopPropagation();
                    }
    
                    tacticCheckbox.addEventListener('change', async (u: unknown) => {
                        const e = u as Event;
                        e.stopPropagation(); // Prevents click from triggering page change
                        const roster = thisPage.settings?.roster;
                        if (!roster)
                            return;

                        if ((e.target as HTMLInputElement).checked) {
                            if (roster.battleTacticCards.length >= 2){
                                tacticCheckbox.checked = false;
                                return;
                            }
                            item.classList.remove(notAdded);
                            item.classList.add(added);
                            roster.battleTacticCards.push(tacticCard);
                        } else {
                            item.classList.add(notAdded);
                            item.classList.remove(added);
                            if (roster.battleTacticCards.length === 1) {
                                roster.battleTacticCards = [];
                            } else {
                                for (let i = 0; i < roster.battleTacticCards.length; ++i) {
                                    if (roster.battleTacticCards[i].id === tacticCard.id) {
                                        roster.battleTacticCards.splice(i, 1);
                                        break
                                    }
                                }
                            }
                        }
                        await putRoster(roster);

                        toggleDisableUnchecked(roster.battleTacticCards.length > 1);
                    });

                    right.append(tacticCheckbox);
                } else {
                    // to-do sort out upgrade favorites
                    heart = newFavoritesCheckbox(tacticCard.name, 'tactic', onchange);
                    right.append(heart);
                }
    
                item.append(left, right);
                tacticList.appendChild(item);
                if (heart && heart.checked)
                    onchange(true, tacticCard.name, 'tactic');

                const roster = thisPage.settings?.roster;
                if (roster)
                    toggleDisableUnchecked(roster.battleTacticCards.length > 1);
            });
        }
        setHeaderTitle('Battle Tactic Cards');
        disableHeaderContextMenu();
        initializeFavoritesList();
        _makeTacticLayout();
        await loadTactics();
        swapLayout();
        initializeDraggable('tactics');
    }
}

export const registerTacticsPage = () => {
    getPageRouter()?.registerPage('tactics', tacticsPage);
}