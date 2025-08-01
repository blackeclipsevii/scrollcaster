const clearDraggableOrder = () => {
    localStorage.removeItem('draggableOrder');
}

const initializeDraggable = (pageId) => {
    const container = document.getElementById('visible-content');
    let savedOrder = JSON.parse(localStorage.getItem(`draggableOrder`));
    if (savedOrder && savedOrder[pageId]) {
        savedOrder[pageId].forEach(id => {
            console.log(id);
            const elem = container.querySelector(`[id="${id}"]`);
            if (elem) container.appendChild(elem);
        });
    }
    const LONG_PRESS_DELAY = 500;
    let pressTimer = null;
    let dragged = null;
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    let startX = 0, startY = 0;
    let width = 0;
    const dragThreshold = 5; // in pixels

    document.querySelectorAll('.draggable').forEach(elem => {
        elem.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.selectable-item')) return; // bail on interactive sub-elements
            pressTimer = setTimeout(() => {
                dragged = elem;
                const rect = elem.getBoundingClientRect();
                width = rect.width;
                startX = e.clientX;
                startY = e.clientY;
                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
                
                dragged.style.transform = 'rotate(-1deg)';
                dragged.style.transition = 'transform 0.2s ease';
            }, LONG_PRESS_DELAY);
        });
    });

    document.addEventListener('pointermove', (e) => {
        clearTimeout(pressTimer);

        if (!dragged) return;

        const movedX = Math.abs(e.clientX - startX);
        const movedY = Math.abs(e.clientY - startY);

        // Only start dragging after threshold exceeded
        if (!isDragging && (movedX > dragThreshold || movedY > dragThreshold)) {
            isDragging = true;
            const parentRect = dragged.parentElement.getBoundingClientRect();
            dragged.style.position = 'absolute';
            dragged.style.margin = '0px';
            dragged.style.left = `${startX - offsetX - parentRect.left}px`;
            dragged.style.top = `${startY - offsetY - parentRect.top}px`;
            dragged.style.width = `${width}px`;
            dragged.style.zIndex = 1000;
            dragged.style.transform = 'rotate(-3deg)';
            dragged.style.transition = 'transform 0.2s ease';
        }

        if (isDragging) {
            const parentRect = dragged.parentElement.getBoundingClientRect();
            const newTop = e.clientY - offsetY - parentRect.top;
            dragged.style.top = `${newTop}px`;

            const siblings = Array.from(dragged.parentElement.children).filter(c => c !== dragged && c !== ghost);
            updateGhostPosition(dragged, siblings);
        }
    });

    document.addEventListener('pointerup', () => {
        clearTimeout(pressTimer);

        if (isDragging && dragged) {

            // 🧠 Decide new sibling position
            const parent = dragged.parentElement;
            const siblings = Array.from(parent.children).filter(child => child !== dragged);

            const draggedRect = dragged.getBoundingClientRect();
            const draggedCenterY = draggedRect.top + draggedRect.height / 2;

            let insertBefore = siblings.find(sibling => {
                const rect = sibling.getBoundingClientRect();
                return draggedCenterY < rect.top + rect.height / 2;
            });

            dragged.style.margin = '';
            dragged.style.position = '';
            dragged.style.zIndex = '';
            dragged.style.left = '';
            dragged.style.top = '';
            dragged.style.width = '';
            dragged.style.transform = '';
            dragged.style.transition = '';

            if (insertBefore) {
                parent.insertBefore(dragged, insertBefore);
            } else {
                parent.appendChild(dragged);
            }

            ghost.remove();

            const currentOrder = Array.from(container.children)
            .filter(el => el.classList.contains('draggable'))
            .map(el => el.id);

            if (!savedOrder)
                savedOrder = {};

            savedOrder[pageId] = currentOrder;
            localStorage.setItem(`draggableOrder`, JSON.stringify(savedOrder));
        }
        dragged = null;
        isDragging = false;
    });

    let ghost = document.createElement('div');
    ghost.className = 'ghost-slot';

    function updateGhostPosition(dragged, siblings) {
        const draggedCenterY = dragged.getBoundingClientRect().top + dragged.offsetHeight / 2;
        const parent = dragged.parentElement;

        let insertBefore = siblings.find(sibling => {
            const rect = sibling.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            return draggedCenterY < centerY;
        });

        // If not already in the DOM, insert ghost
        if (!parent.contains(ghost)) {
            ghost.style.height = `${dragged.offsetHeight}px`;
            ghost.style.width = `${dragged.offsetWidth}px`;
            parent.appendChild(ghost);
        }

        // Move ghost to the new spot
        if (insertBefore) {
            parent.insertBefore(ghost, insertBefore);
        } else {
            parent.appendChild(ghost);
        }
    }
}