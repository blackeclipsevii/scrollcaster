
function getScrollbarWidth() {
    // Create a temporary container with forced scrollbars
    const outer = document.createElement('div');
    outer.style.visibility = 'hidden';
    outer.style.overflow = 'scroll';
    outer.style.msOverflowStyle = 'scrollbar'; // For older IE
    outer.style.width = '100px';
    outer.style.position = 'absolute';
    document.body.appendChild(outer);

    // Add an inner element and measure the difference
    const inner = document.createElement('div');
    inner.style.width = '100%';
    outer.appendChild(inner);

    const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;

    // Clean up
    outer.remove();

    return scrollbarWidth;
}