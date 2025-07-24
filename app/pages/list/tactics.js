const tacticsPage = {
    loadPage: () => {
        const _makeTacticLayout = () => {
            const sections = [
                'Battle Tactic Cards'
            ];
            clearLayout();
            makeLayout(sections);
        }
        
        async function loadTactics() {
            _makeTacticLayout();
            const tacticList = document.querySelector('.item-list');
            const section = tacticList.closest('.section');
            section.style.display = 'block';
        
            let url = `${endpoint}/tactics`;
            await fetch(encodeURI(url)).
            then(resp => resp.json()).
            then(tactics => {
                tactics.forEach(tacticCard => {
                    let skipTactic = false;
                    if (roster) {
                        roster.battleTacticCards.forEach(bt => {
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
        
                    if (roster) {
                        const addBtn = document.createElement('button');
                        addBtn.classList.add('rectangle-button');
                        addBtn.textContent = '+';
                        addBtn.addEventListener('click', async (e) => {
                            e.stopPropagation(); // Prevents click from triggering page change
                            item.classList.remove('not-added');
                            roster.battleTacticCards.push(tacticCard);
                            await putRoster(roster);
                            goBack();
                        });
        
                        right.append(addBtn);
                    }
        
                    item.append(left, right);
                    tacticList.appendChild(item);
                    if (heart.checked)
                        onchange(true, tacticCard.name, 'tactic');
                });
            });
        }
        setHeaderTitle('Battle Tactic Cards');
        loadTactics();
        
        loadScrollData();
    }
}

dynamicPages['tactics'] = tacticsPage;