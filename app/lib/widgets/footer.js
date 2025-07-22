var _lastLink = null;

function initializeFooter(root) {
    const key = _inCatalog ? 'catalog-last-link' : 'roster-last-link';
    const defaultRosterLink = `${root}/index.html`;
    const defaultCatLink = `${root}/pages/catalog/catalog.html`;

    const saveLink = () => {
      const otherKey = _inCatalog ? 'roster-last-link' : 'catalog-last-link';
      let value = window.location.href;
      if (!value.includes('loadScrollData')) {
        const delim = value.includes('?') ? '&' : '?';
        value = `${value}${delim}loadScrollData=true`;
      }
      localStorage.setItem(otherKey, value);
    };

    _lastLink = (() => {
        const tmp = localStorage.getItem(key);
        if (tmp)
          return tmp;
        
        if (_inCatalog)
          return defaultRosterLink;
        return defaultCatLink;
    })();

    const main = document.querySelector('.main');
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <div class='footer-button footer-left'>
        <div id='catalog-button'>Catalog</div>
        <img src='${root}/resources/abSpecial.png'></img>
      </div>
      <div class='footer-button footer-right'>
        <div id='army-button'>Rosters</div>
        <img src='${root}/resources/abOffensive.png'></img>
      </div>
    `;
    main.appendChild(footer);

    const left = document.getElementById('catalog-button');
    left.onclick = () => {
      localStorage.setItem('inCatalog', 'true');
      if (_inCatalog) {
        window.location.href = encodeURI(defaultCatLink);
      } else {
        saveLink();
        window.location.href = _lastLink;
      }
    };
    const right = document.getElementById('army-button');
    right.onclick = () => {
      localStorage.setItem('inCatalog', 'false');
      if (!_inCatalog) {
        window.location.href = encodeURI(defaultRosterLink);
      } else {
        saveLink();
        window.location.href = _lastLink;
      }
    };
}