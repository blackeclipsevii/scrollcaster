// make html page layout
const makeLayout = (sections) => {
    const _makeSection = (main, name) => {
        const section = document.createElement('div');
        section.style.display = 'none';
        section.className = 'section';
        section.innerHTML = `
            <h3 class="section-title">${name}</h3>
            <div class="item-list" id="${name.toLowerCase().replace(/ /g, '-')}-list"></div>
        `;
        main.appendChild(section);
    }   

    const main = document.querySelector('.main');
    sections.forEach(name => {
        _makeSection(main, name)
    });
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
