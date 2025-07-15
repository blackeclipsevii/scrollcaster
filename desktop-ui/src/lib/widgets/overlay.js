
const addOverlayListener = () => {
    const overlay = document.getElementById('overlay');
        overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            overlay.style.display = 'none';
        }
    });
}
