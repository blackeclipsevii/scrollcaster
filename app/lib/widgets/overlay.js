
const addOverlayListener = () => {
    let overlay = document.getElementById('overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'overlay';
        overlay.id = 'overlay';
        let modal = document.createElement('div');
        modal.className = 'modal';
        overlay.appendChild(modal);

        let main = document.querySelector('.persist');
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
  //  document.body.classList.add('no-scroll');
    overlay.style.display = style;
}

const disableOverlay = () => {
  //  document.body.classList.remove('no-scroll');
    const modal = overlay.querySelector('.modal');
    modal.style.marginLeft = '';
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

function getScrollbarWidth() {
    // Create a temporary container with forced scrollbars
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.msOverflowStyle = 'scrollbar'; // For older IE
    outer.style.width = '100px';
    outer.style.position = 'absolute';
    document.body.appendChild(outer);

    // Add an inner element and measure the difference
    const inner = document.createElement('div');
    inner.style.width = '100%';
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Clean up
    outer.remove();

    return scrollbarWidth;
}