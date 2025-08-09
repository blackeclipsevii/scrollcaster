
export const Overlay = {
    //private
    _getScrollbarWidth: () => {
        // Create a temporary container with forced scrollbars
        const outer = document.createElement('div');
        outer.style.visibility = 'hidden';
        outer.style.overflow = 'scroll';
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
    },

    // public
    initialize() {
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
                main = document.querySelector('body') as HTMLElement;
            main.appendChild(overlay);
        }

        overlay.addEventListener('click', function(event) {
            if (event.target === overlay) {
                if (!overlay.classList.contains('block-close'))
                    Overlay.disable();
            }
        });
    },
    disable() {
        const overlay = document.getElementById('overlay');
        if (overlay)
            overlay.style.display = 'none';
    },
    toggleFactory(visibleStyle: string, ondisplay: ((data:unknown) => unknown)) {
        const _enableOverlay = (style: string) => {
            const overlay = document.getElementById("overlay");
            if (!overlay)
                return;

            const modal = overlay.querySelector('.modal');
            if (!modal) 
                return;

            modal.innerHTML = '';
            modal.removeAttribute('style');
            overlay.removeAttribute('style');
            modal.className = 'modal';
            overlay.className = 'overlay';
            overlay.style.display = style;
        }

        const toggleFunc = (data: unknown) => {
            visibleStyle = 'flex';
            const overlay = document.getElementById("overlay");
            if (!overlay)
                return;

            if (overlay.style.display === visibleStyle) {
                Overlay.disable();
            } else {
                _enableOverlay(visibleStyle);
                ondisplay(data);
                
                if (visibleStyle !== 'flex') {
                    const modal = overlay.querySelector('.modal') as HTMLElement | null;
                    if (modal) {
                        const offset = (window.innerWidth - modal.clientWidth - this._getScrollbarWidth()) / 2.0;
                        modal.style.marginLeft = `${offset}px`;
                    }
                }
            }
        };
        return toggleFunc;
    }
}
