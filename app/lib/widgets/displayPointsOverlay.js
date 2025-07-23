var totalPoints;

function _saveTotalPoints(id) {
    localStorage.setItem(`${id}-total-points`, totalPoints);
}

function _loadTotalPoints(id) {
    totalPoints = localStorage.getItem(`${id}-total-points`);
}

function displayPointsOverlay(id) {
    const main = document.querySelector('.main');
    const overlay = document.createElement('div');
    overlay.id = 'pointsOverlay';
    main.appendChild(overlay);
    _loadTotalPoints(id);
}

async function updateValidationDisplay() {
    const errors = await validateRoster(roster);
    const pointsOverlay = document.getElementById('pointsOverlay');
    const hasErrors = errors.length > 0;
    const postfix = hasErrors ? 'invalid' : 'valid';
    pointsOverlay.className = `points-overlay-${postfix}`;

    pointsOverlay.onclick = overlayToggleFactory('block', () =>{
        const modal = document.querySelector(".modal");
        modal.innerHTML = '';
    
        const title = document.createElement('h3');
        title.innerHTML = 'Validation Errors';
        modal.appendChild(title);
    
        const section = document.createElement('div');
        section.style.width = '95%';
    
        if (hasErrors) {
            errors.forEach(error => {
                const p = document.createElement('p');
                p.innerHTML = `* ${error}`;
                section.appendChild(p);
            });
        } else {
            const p = document.createElement('p');
            p.innerHTML = `List is valid.`;
            section.appendChild(p);
        }
    
        modal.appendChild(section);
        const offset = (window.innerWidth - modal.clientWidth) / 2.0;
        modal.style.marginLeft = `${offset}px`;
    });
};

function refreshPointsOverlay(id) {
    let pointsOverlay = document.getElementById('pointsOverlay');
    pointsOverlay.textContent = `${totalPoints} / ${roster.points} pts`;
    _saveTotalPoints(id);
}
