// make html page layout

const makeLayout = (sections, factory=null, parent=null, show=false) => {
    if (factory === null)
        factory = (main, name) => {
            const adjustedName = name.toLowerCase().replace(/ /g, '-');
            const section = document.createElement('div');
            if (!show)
                section.style.display = 'none';
            section.className = 'section draggable';
            section.id = `${adjustedName}-section`;
            section.innerHTML = `
                <h3 class="section-title">${name}</h3>
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
        }   

    const main = parent ? parent : document.getElementById('loading-content');
    sections.forEach(name => {
        factory(main, name);
    });
}


const swapLayout = () => {
    const oldView = document.getElementById('visible-content');
    const newView = document.getElementById('loading-content');
    newView.className = 'main';
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
