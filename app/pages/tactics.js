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

        let result = null;
        await fetch(encodeURI(`${endpoint}/tactics`)).
        then(resp => resp.json()).
        then(tactics => result = tactics);
        this._cache.tactics = result;
        return result;
    },
    loadPage(settings) {
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
            const tacticList = document.querySelector('.item-list');
            const section = tacticList.closest('.section');
            section.style.display = 'block';
        
            const tactics = await thisPage.fetchTactics();
            tactics.forEach(tacticCard => {
                let skipTactic = false;
                if (thisPage.settings.roster) {
                    thisPage.settings.roster.battleTacticCards.forEach(bt => {
                        if (tacticCard.name === bt.name) {
                            skipTactic = true;
                        }
                    });
                    if (skipTactic)
                        return;
                }
    
                const item = document.createElement('div');
                item.classList.add('selectable-item');
                item.classList.add('not-added');
    
                const left = document.createElement('div');
                left.classList.add('selectable-item-left');
    
                const nameEle = document.createElement('p');
                nameEle.className = 'selectable-item-name';
                nameEle.textContent = tacticCard.name;
                nameEle.style.padding = '0px';
                nameEle.style.margin = '0px';
                left.appendChild(nameEle);
    
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
                    addBtn.classList.add('rectangle-button');
                    addBtn.textContent = '+';
                    addBtn.addEventListener('click', async (e) => {
                        e.stopPropagation(); // Prevents click from triggering page change
                        item.classList.remove('not-added');
                        roster.battleTacticCards.push(tacticCard);
                        await putRoster(thisPage.settings.roster);
                        goBack();
                    });
    
                    right.append(addBtn);
                }
    
                item.append(left, right);
                tacticList.appendChild(item);
                if (heart.checked)
                    onchange(true, tacticCard.name, 'tactic');
            });
        }
        setHeaderTitle('Battle Tactic Cards');
        enableBackButton();
        disableHeaderContextMenu();
        _makeTacticLayout();
        loadTactics();
        swapLayout();
    }
}

dynamicPages['tactics'] = tacticsPage;