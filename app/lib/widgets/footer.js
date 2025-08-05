function initializeFooter(root) {
    const main = document.querySelector('.persist');
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <div id='footer-left' class='footer-button footer-left'>
        <img class='navigation-img invert-img' src='${root}/resources/${getVar('ab-special')}'></img>
        <div id='catalog-button'>Catalog</div>
      </div>
      <div id='footer-right' class='footer-button footer-right'>
        <img class='navigation-img invert-img' src='${root}/resources/${getVar('ab-offensive')}'></img>
        <div id='army-button'>Rosters</div>
      </div>
    `;
    main.appendChild(footer);

    const left = document.getElementById('footer-left');
    left.onclick = () => {
      if (_inCatalog) {
        dynamicGoTo(new CatalogSettings);
        _linkStack['catalog'].history = [];
      } else {
        localStorage.setItem('inCatalog', 'true');
        _inCatalog = true;
        if (_linkStack['catalog'].currentSettings)
          dynamicGoTo(_linkStack['catalog'].currentSettings, false);
        else
          dynamicGoTo(new CatalogSettings);
      }
    };
    const right = document.getElementById('footer-right');
    right.onclick = () => {
      if (!_inCatalog) {
        dynamicGoTo(new RosterSettings);
        _linkStack['roster'].history = [];
      } else {
        localStorage.setItem('inCatalog', 'false');
        _inCatalog = false;
        if (_linkStack['roster'].currentSettings)
          dynamicGoTo(_linkStack['roster'].currentSettings, false);
        else
          dynamicGoTo(new RosterSettings);
      }
    };

    const inset = new InsetEdges;
    if (inset.bottom) {
        footer.style.paddingBottom = `${inset.bottom}px`;
        left.style.marginBottom = `${inset.bottom}px`;
        right.style.marginBottom = `${inset.bottom}px`;
    }
}