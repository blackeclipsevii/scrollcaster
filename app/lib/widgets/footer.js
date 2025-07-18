
function initializeFooter(root) {
    const main = document.querySelector('.main');
    const footer = document.createElement('footer');
    footer.innerHTML = `
      <div class='footer-left'>
        <div class='footer-button' id='catalog-button'>Catalog 📖</div>
      </div>
      <div class='footer-right'>
        <div class='footer-button' id='army-button'>Rosters ⚔️</div>
      </div>
    `;
    main.appendChild(footer);

    const left = document.getElementById('catalog-button');
    left.onclick = () => {
      window.location.href = encodeURI(`${root}/pages/catalog/catalog.html`);
    };
    const right = document.getElementById('army-button');
    right.onclick = () => {
      window.location.href = encodeURI(`${root}/index.html`);
    };
}