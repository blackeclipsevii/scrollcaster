// make html page layout

const layoutDefaultFactory = (main, name, show=true) => {
    const adjustedName = name.toLowerCase().replace(/ /g, '-');
    const section = document.createElement('div');
    if (!show)
        section.style.display = 'none';
    section.className = 'section draggable';
    section.id = `${adjustedName}-section`;
    section.innerHTML = `
        <div class="draggable-grip">
            <span class="grip-icon">⋮⋮⋮</span>
            <h3 class="section-title">${name}</h3>
        </div>
        <div class="item-list" id="${adjustedName}-list"></div>
    `;

    const oldElement = document.getElementById(section.id);
    if (oldElement) {
        // we have to destroy it
        oldElement.parentElement.removeChild(oldElement);
    }
    
    //const snapZone = document.createElement('div');
    //snapZone.className ='snap-zone';
    main.append(section);
    return section;
}  

const makeLayout = (sections, factory=null, parent=null, show=false) => {
    if (factory === null)
        factory = layoutDefaultFactory;

    const main = parent ? parent : document.getElementById('loading-content');
    sections.forEach(name => {
        factory(main, name, show);
    });
}


const swapLayout = () => {
    const oldView = document.getElementById('visible-content');
    const newView = document.getElementById('loading-content');
    newView.className = 'main';
    const inset = new InsetEdges;
    if (inset.top) {
        const top = document.querySelector('header').offsetHeight + 7;
        newView.style.marginTop = `${top}px`;
    } if (inset.bottom) {
        const bottom = document.querySelector('footer').offsetHeight + 7;
        newView.style.marginBottom = `${bottom}px`;
    }
    newView.style.display = '';
    oldView.style.display = 'none';
    oldView.className = '';
    oldView.id = 'loading-content';
    newView.id = 'visible-content';
    oldView.innerHTML = '';
}

// remove all existing sections
const clearLayout = () => {
    const main = document.querySelector('.main');
    const sections = main.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.parentElement === main)
            main.removeChild(section);
    });
};
