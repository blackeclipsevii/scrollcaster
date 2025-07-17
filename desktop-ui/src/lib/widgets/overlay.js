
const addOverlayListener = () => {
    const overlay = document.getElementById('overlay');
        overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            disableOverlay();
        }
    });
}

const enableOverlay = (style) => {
    document.body.classList.add('no-scroll');
    overlay.style.display = style;
}

const disableOverlay = () => {
    document.body.classList.remove('no-scroll');
    overlay.style.display = 'none';
}

const overlayToggleFactory = (visibleStyle, ondisplay) => {
    const toggleFunc = (data) => {
        const overlay = document.getElementById("overlay");
        if (overlay.style.display === visibleStyle) {
            disableOverlay();
        } else {
            enableOverlay(visibleStyle);
            ondisplay(data);            
        }
    };
    return toggleFunc;
}