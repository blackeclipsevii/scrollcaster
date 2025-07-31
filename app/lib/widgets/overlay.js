
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
            if (!overlay.classList.contains('block-close'))
                disableOverlay();
        }
    });
}

const disableOverlay = () => {
  //  document.body.classList.remove('no-scroll');
    const modal = overlay.querySelector('.modal');
    overlay.style.display = 'none';
}

const overlayToggleFactory = (visibleStyle, ondisplay) => {
    const _enableOverlay = (style) => {
        //  document.body.classList.add('no-scroll');
        const modal = overlay.querySelector('.modal');
        modal.innerHTML = '';
        modal.removeAttribute('style');
        overlay.removeAttribute('style');
        modal.className = 'modal';
        overlay.className = 'overlay';
        overlay.style.display = style;
    }

    const toggleFunc = (data) => {
        visibleStyle = 'flex';
        const overlay = document.getElementById("overlay");
        if (overlay.style.display === visibleStyle) {
            disableOverlay();
        } else {
            _enableOverlay(visibleStyle);
            ondisplay(data);
            
            if (visibleStyle !== 'flex') {
                const modal = overlay.querySelector('.modal');
                const offset = (window.innerWidth - modal.clientWidth - getScrollbarWidth()) / 2.0;
                modal.style.marginLeft = `${offset}px`;
            }
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