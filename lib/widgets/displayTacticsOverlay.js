const displayTacticsOverlay = overlayToggleFactory('block', (tacticCard) =>{
    const modal = document.querySelector(".modal");
    modal.innerHTML = '';

    const section = document.createElement('div');
    section.className = 'section';

    let ele = document.createElement('h3');
    ele.innerHTML = tacticCard.name;

    section.appendChild(ele);

    tacticCard.tactics.forEach(tactic => {
        const section2 = document.createElement('div');
        section2.className = 'section';
        ele = document.createElement('h3');
        ele.innerHTML = tactic.type.name;
        section2.appendChild(ele);

        ele = document.createElement('p');
        ele.innerHTML = tactic.text;
        section2.appendChild(ele);
        section.appendChild(section2);
    });
    modal.appendChild(section);
    const offset = (window.innerWidth - modal.clientWidth- getScrollbarWidth()) / 2.0;
    modal.style.marginLeft = `${offset}px`;
});