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
                let disableTactic = false;
                if (thisPage.settings.roster) {
                    thisPage.settings.roster.battleTacticCards.forEach(bt => {
                        if (tacticCard.name === bt.name) {
                            disableTactic = true;
                        }
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
    
                // tactic card id not unique? doesn't exist?
                const heart = newFavoritesCheckbox(tacticCard.name, 'tactic', onchange);
    
                right.append(heart);

                if (thisPage.settings.roster) {
                    const addBtn = document.createElement('button');
                    
                    const setSelected = () => {
                        const typeEle = document.createElement('span');
                        typeEle.className = 'ability-label';
                        typeEle.style.display = 'inline-block';
                        typeEle.textContent = 'Selected';
                        typeEle.style.backgroundColor = getVar('section-color');
                        typeEle.style.color = getVar('green-color');
                        typeEle.style.border = `1px solid ${typeEle.style.color}`;
                        left.appendChild(typeEle);
                        item.classList.remove('not-added');
                        addBtn.disabled = true;
                    }
        
                    addBtn.classList.add('rectangle-button');
                    addBtn.textContent = '+';
                    addBtn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // Prevents click from triggering page change
                        roster.battleTacticCards.push(tacticCard);
                        setSelected();
                        await putRoster(thisPage.settings.roster);
                        if (roster.battleTacticCards.length >= 2)
                            goBack();
                    });

                    if (disableTactic) {
                        setSelected();
                    }
    
                    right.append(addBtn);
                }
    
                item.append(left, right);
                tacticList.appendChild(item);
                if (heart.checked)
                    onchange(true, tacticCard.name, 'tactic');
            });
        }
        setHeaderTitle('Battle Tactic Cards');
        disableHeaderContextMenu();
        initializeFavoritesList();
        _makeTacticLayout();
        await loadTactics();
        swapLayout();
    }
}

dynamicPages['tactics'] = tacticsPage;