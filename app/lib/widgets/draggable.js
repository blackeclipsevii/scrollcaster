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
    const scrollSpeed = 10;      // pixels per frame
    const scrollThreshold = 50;  // distance from edge in px
    let pressTimer = null;
    let dragged = null;
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    let startX = 0, startY = 0;
    let width = 0;
    const dragThreshold = 5; // in pixels


    const onStart = (e, elem) => {
        pressTimer = setTimeout(() => {
            
            document.body.classList.add('noselect');
            dragged = elem;
            const rect = elem.getBoundingClientRect();
            width = rect.width * .98; // non-scientific math accounting for the angled width difference
            startX = e.clientX;
            startY = e.clientY;
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            dragged.style.width = `${width}px`;
            dragged.style.border = `2px dashed ${getVar('white-3')}`
            dragged.style.maxHeight = '33vh';
            dragged.style.overflow = 'hidden';
            dragged.style.transform = 'rotate(1deg)';
            dragged.style.transition = 'transform 0.2s ease';
        }, LONG_PRESS_DELAY);
    };

    const onMove = (e) => {
        clearTimeout(pressTimer);

        if (!dragged) return;

        const doScroll = () => {
            const y = e.clientY;
            const windowHeight = window.innerHeight;

            if (y < scrollThreshold) {
                window.scrollBy(0, -scrollSpeed);
            } else if (y > windowHeight - scrollThreshold) {
                window.scrollBy(0, scrollSpeed);
            }
        }
        // perform a scroll if the drag goes close to the edge
        doScroll();

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
            dragged.style.zIndex = 1000;
            dragged.style.transform = 'rotate(3deg)';
            dragged.style.transition = 'transform 0.2s ease';
        }

        if (isDragging) {
            const parentRect = dragged.parentElement.getBoundingClientRect();
            const newTop = e.clientY - offsetY - parentRect.top;
            dragged.style.top = `${newTop}px`;

            const siblings = Array.from(dragged.parentElement.children).filter(c => c !== dragged && c !== ghost);
            updateGhostPosition(dragged, siblings);
        }
    }

    const onEnd = (e) => {
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
        if (dragged) {
            dragged.style.border = ``
            dragged.style.maxHeight = '';
            dragged.style.overflow = '';
            dragged.style.transform = '';
            dragged.style.transition = '';
        }
        dragged = null;
        isDragging = false;
        document.body.classList.remove('noselect');
    }

    document.querySelectorAll('.draggable-grip, .draggable-grip-wrapper').forEach(elem => {
        elem.addEventListener('mousedown', (e) => {
            if (e.target.closest('button'))
                return; // bail on interactive sub-elements
            
            const draggable = e.target.closest('.draggable');
            onStart(e, draggable);
        });

        elem.addEventListener('touchstart', (e) => {
            if (e.touches.length > 1) return;

            if (e.touches[0].target.closest('button'))
                return; // bail on interactive sub-elements
            
            e.preventDefault(); //Prevent scrolling

            const draggable = e.target.closest('.draggable');
            onStart(e.touches[0], draggable);
        });
    });

    document.addEventListener('touchmove', (e) => {
        if (dragged) e.preventDefault(); //Prevent scrolling
        onMove(e.touches[0]);
    });

    document.addEventListener('touchend', (e) => {
        onEnd(e.touches[0]);
    });

    document.addEventListener('touchcancel', (e) => {
        onEnd(e.touches[0]);
    });

    document.addEventListener('mousemove', onMove);

    document.addEventListener('mouseup', onEnd);

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