// make html page layout
import { InsetEdges } from "./InsetEdges.js";

export const layoutDefaultFactory = (main: HTMLElement, name: string, show=true) => {
    const adjustedName = name.toLowerCase().replace(/ /g, '-');

    const sectionId = `${adjustedName}-section`;;
    let section = null;
    const oldElement = document.getElementById(sectionId);
    if (oldElement && oldElement.parentElement) {
        // we have to destroy it
        oldElement.parentElement.removeChild(oldElement);
        const list = oldElement.querySelector('item-list');
        if (list) {
            list.innerHTML = '';
            section = oldElement;
        }
    } 

    if (!section) {
        section = document.createElement('div');
        if (!show)
            section.style.display = 'none';
        section.className = 'section draggable';
        section.id = sectionId;
        section.innerHTML = `
            <div class="draggable-grip">
                <span class="grip-icon">⋮⋮⋮</span>
                <h3 class="section-title">${name}</h3>
            </div>
            <div class="item-list" id="${adjustedName}-list"></div>
        `;
    }

    //const snapZone = document.createElement('div');
    //snapZone.className ='snap-zone';
    main.append(section);
    return section;
}  

export const makeLayout = (sections: string[], 
                           factory: ((main: HTMLElement, name: string, show: boolean) => HTMLElement) | null = null, 
                           parent: HTMLElement | null = null,
                           show=false) => {

    if (factory === null)
        factory = layoutDefaultFactory;

    const main = parent ? parent : document.getElementById('loading-content');
    if (!main) {
        return;
    }

    sections.forEach(name => {
        factory(main, name, show);
    });
}

export const swapLayout = () => {
    const oldView = document.getElementById('visible-content');
    if (!oldView)
        return;
    const newView = document.getElementById('loading-content');
    if (!newView)
        return;
    newView.className = 'main';
    const inset = new InsetEdges;
    if (inset.top) {
        const header = document.querySelector('header');
        if (header) {
            const top = header.offsetHeight + 7;
            newView.style.marginTop = `${top}px`;
        }
    } if (inset.bottom) {
        const footer = document.querySelector('footer');
        if (footer) {
            const bottom = footer.offsetHeight + 7;
            newView.style.marginBottom = `${bottom}px`;
        }
    }
    newView.style.display = '';
    oldView.style.display = 'none';
    oldView.className = '';
    oldView.id = 'loading-content';
    newView.id = 'visible-content';
    oldView.innerHTML = '';
}

// remove all existing sections
export const clearLayout = () => {
    const main = document.querySelector('.main');
    if (!main) {
        return;
    }
    const sections = main.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.parentElement === main)
            main.removeChild(section);
    });
};
