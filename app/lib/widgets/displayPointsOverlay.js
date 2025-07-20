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

function updateValidationDisplay() {
    const errors = validateRoster(roster);
    const pointsOverlay = document.getElementById('pointsOverlay');
    const hasErrors = errors.length > 0;
    pointsOverlay.style.backgroundColor = hasErrors ? 'red' : 'green';

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
            p.innerHTML = `Basic validation has passed!<br/><br/><strong>Warning: Regiment option validation is not implemented.</string>`;
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

function unitTotalPoints(unit) {
    if (!unit.points)
        return 0;

    let pts = unit.points;
    
    if (unit.isReinforced)
        pts += unit.points;

    if ( unit.heroicTrait && unit.heroicTrait.points)
        pts += unit.heroicTrait.points;
    
    if (unit.artefact && unit.artefact.points)
        pts += unit.artefact.points;
    
    return pts;
}
