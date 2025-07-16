
function initializeFooter(root) {
    const left = document.getElementById('catalog-button');
    left.onclick = () => {
      window.location.href = encodeURI(`${root}/pages/catalog/catalog.html`);
    };
    const right = document.getElementById('army-button');
    right.onclick = () => {
      window.location.href = encodeURI(`${root}/index.html`);
    };
}