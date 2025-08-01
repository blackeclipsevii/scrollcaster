class TacticsSettings {
    roster = null
};

const tacticsPage = {
    settings: null,
    _cache: {
        tactics: null
    },
    async fetchTactics() {
        if (this._cache.tactics)
            return this._cache.tactics;
        let result = await fetchWithLoadingDisplay(encodeURI(`${endpoint}/tactics`));
        this._cache.tactics = result;
        return result;
    },
    async loadPage(settings) {
        if (!settings)
            settings = new TacticsSettings;

        this.settings = settings;

        thisPage = this;

        const _makeTacticLayout = () => {
            const sections = [
                'Battle Tactic Cards'
            ];
            makeLayout(sections);
        }
        
        async function loadTactics() {
            const tacticList = document.getElementById('battle-tactic-cards-list');
            const section = document.getElementById('battle-tactic-cards-section');
            section.style.display = 'block';
        
            const tactics = await thisPage.fetchTactics();
            tactics.forEach(tacticCard => {
                let currentPosition = -1;
                if (thisPage.settings.roster) {
                    thisPage.settings.roster.battleTacticCards.forEach((bt, idx) => {
                        if (tacticCard.name === bt.name)
                            currentPosition = idx;
                    });
                }
    
                const item = document.createElement('div');
                item.classList.add('selectable-item');
                if (!_inCatalog)
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
                left.addEventListener('click', () => {
                    displayTacticsOverlay(tacticCard);
                });
    
                const right = document.createElement('div');
                right.classList.add('selectable-item-right');
    
                const onchange = newFavoritesOnChange(tacticList, item, tacticCard.name);

                const toggleDisableUnchecked = (disabled) => {
                    const checkboxes = section.querySelectorAll('.tactic-checkbox');
                    checkboxes.forEach(box => {
                        if (!box.checked) {
                            box.disabled = disabled;
                        }
                    });
                }
    
                // tactic card id not unique? doesn't exist?
                let heart = null;
                if (thisPage.settings.roster) {
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
    
                    tacticCheckbox.addEventListener('change', async (e) => {
                        e.stopPropagation(); // Prevents click from triggering page change
                        if (e.target.checked) {
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
                        await putRoster(thisPage.settings.roster);

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

                toggleDisableUnchecked(roster.battleTacticCards.length > 1);
            });
        }
        setHeaderTitle('Battle Tactic Cards');
        disableHeaderContextMenu();
        initializeFavoritesList();
        _makeTacticLayout();
        await loadTactics();
        swapLayout();
        initializeDraggable();
    }
}

dynamicPages['tactics'] = tacticsPage;