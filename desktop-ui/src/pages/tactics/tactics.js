
const params = new URLSearchParams(window.location.search);
const rosterId = params.get('id');
fixedPreviousUrl = encodeURI(`../army/army.html?id=${rosterId}`);

async function loadTactics() {
    roster = await getRoster(rosterId);

    let url = `${hostname}:${port}/tactics`;
    await fetch(encodeURI(url)).
    then(resp => resp.json()).
    then(tactics => {
        tactics.forEach(tacticCard => {
            let skipTactic = false;
            roster.battleTacticCards.forEach(bt => {
                if (tacticCard.name === bt.name) {
                    skipTactic = true;
                }
            });
            if (skipTactic)
                return;

            const item = document.createElement('div');
            item.classList.add('selectable-item');

            // Clicking the container navigates to details
            item.addEventListener('click', () => {
                displayTacticsOverlay(tacticCard);
            });

            const left = document.createElement('div');
            left.classList.add('selectable-item-left');
            left.textContent = tacticCard.name;

            const right = document.createElement('div');
            right.classList.add('selectable-item-right');

            const addBtn = document.createElement('button');
            addBtn.classList.add('rectangle-button');
            addBtn.textContent = '+';
            addBtn.addEventListener('click', async (e) => {
                e.stopPropagation(); // Prevents click from triggering page change
                roster.battleTacticCards.push(tacticCard);
                await putRoster(roster);
                goBack();
            });

            right.append(addBtn);
            item.append(left, right);

            const tacticList = document.querySelector('.item-list');
            tacticList.appendChild(item);
        });
    });
    loadScrollData();
}

loadTactics();
addOverlayListener();