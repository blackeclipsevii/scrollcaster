var totalPoints;

function _saveTotalPoints(id) {
    localStorage.setItem(`${id}-total-points`, totalPoints);
}

function _loadTotalPoints(id) {
    totalPoints = Number(localStorage.getItem(`${id}-total-points`));
}

const displayPointsOverlay = (id) => {
    let overlay = document.getElementById('pointsOverlay');
    if (!overlay) {
        const main = document.querySelector('.persist');
        overlay = document.createElement('div');
        overlay.id = 'pointsOverlay';
        main.appendChild(overlay);
    } else {
        overlay.style.display = '';
    }
    const inset = new InsetEdges;
    if (inset.bottom) {
        overlay.style.bottom = `${inset.bottom + 75}px`;
    }
    _loadTotalPoints(id);
}

const hidePointsOverlay = () => {
    let overlay = document.getElementById('pointsOverlay');
    if (!overlay)
        return;
    overlay.style.display = 'none';
}

async function updateValidationDisplay() {
    const errors = await validateRoster(roster);
    const pointsOverlay = document.getElementById('pointsOverlay');
    const hasErrors = errors.length > 0;
    const postfix = hasErrors ? 'invalid' : 'valid';
    pointsOverlay.className = `points-overlay-${postfix}`;

    pointsOverlay.onclick = overlayToggleFactory('flex', () =>{
        const modal = document.querySelector(".modal");
        modal.style.border = `2px solid ${getVar('hover-color')}`;

        const title = document.createElement('h3');
        title.innerHTML = 'Validation Errors';
        modal.appendChild(title);
    
        const container = document.createElement('div');

        if (hasErrors) {
            errors.forEach(error => {
                const subSection = document.createElement('div');
                subSection.className = 'section';
                subSection.style.marginLeft = '0px';
                subSection.style.marginRight = '0px';
                subSection.style.padding = '1em';
                subSection.style.backgroundColor = getVar('hover-color');
                subSection.style.border = `2px solid ${getVar('background-color')}`;

                const label = document.createElement('div');
                label.className = 'ability-label';
                label.style.fontWeight = 'bold';
                label.style.backgroundColor = getVar('red-color');
                label.textContent = 'Error';
                label.style.marginTop = '0';
                label.style.marginBottom = '1em';
                subSection.appendChild(label);

                const p = document.createElement('p');
                p.style.padding = 0;
                p.style.margin = 0;
                p.innerHTML = error;
                subSection.appendChild(p);
                container.appendChild(subSection);
            });
        } else {
            const subSection = document.createElement('div');
            subSection.className = 'section';
            subSection.style.marginLeft = '0px';
            subSection.style.marginRight = '0px';
            subSection.style.padding = '1em';
            subSection.style.backgroundColor = getVar('hover-color');
            subSection.style.border = `2px solid ${getVar('background-color')}`;

            const label = document.createElement('div');
            label.className = 'ability-label';
            label.style.backgroundColor = getVar('green-color');
            label.textContent = 'Valid';
            label.style.fontWeight = 'bold';
            label.style.marginTop = '0';
            label.style.marginBottom = '1em';
            subSection.appendChild(label);

            const p = document.createElement('p');
            p.style.padding = 0;
            p.style.margin = 0;
            p.innerHTML = `Your list is valid.`;
            subSection.appendChild(p);
            container.appendChild(subSection);
        }
    
        modal.appendChild(container);
    });
};

function refreshPointsOverlay(id) {
    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
    _saveTotalPoints(id);
}
