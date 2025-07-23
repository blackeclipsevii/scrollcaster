
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');

async function loadTactics() {
    if (rosterId) {
        roster = await getRoster(rosterId);
    }

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

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                displayTacticsOverlay(tacticCard);
            });

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            left.textContent = tacticCard.name;

            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

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

            const tacticList = document.querySelector('.item-list');
            tacticList.appendChild(item);
        });
    });
}

loadTactics();
addOverlayListener();

loadScrollData();