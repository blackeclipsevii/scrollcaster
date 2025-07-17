
const addOverlayListener = () => {
    let overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'overlay';
        let modal = document.createElement('div');
        modal.className = 'modal';
        overlay.appendChild(modal);

        let main = document.querySelector('.main');
        if (!main)
            main = document.querySelector('body');
        main.appendChild(overlay);
    }

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