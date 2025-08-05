// Allow an end user to control where the edges of the display start
// useful for alternative platforms like android
class InsetEdges {
    top = null;
    bottom = null;
    left = null;
    right = null;
    constructor() {
        const params = new URLSearchParams(window.location.search);
        const edges = ['top', 'bottom', 'left', 'right'];
        edges.forEach(edge => {
            const value = params.get(`inset-${edge}`);
            if (value)
                this[edge] = Number(value);
        });
    }
}