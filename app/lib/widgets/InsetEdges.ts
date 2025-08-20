// Allow an end user to control where the edges of the display start
// useful for alternative platforms like android
export class InsetEdges {
    [name: string]: number | null;
    top: number | null;
    bottom: number | null;
    left: number | null;
    right: number | null;
    constructor() {
        this.top = null;
        this.bottom = null;
        this.left = null;
        this.right = null;
        const params = new URLSearchParams(window.location.search);
        const edges = ['top', 'bottom', 'left', 'right'];
        edges.forEach(edge => {
            const value = params.get(`inset-${edge}`);
            if (value)
                this[edge] = Number(value) / 2;
        });

        if (this.bottom === null) {
            this.bottom = 32;
        }
    }
}

let insetsAtLaunch: InsetEdges | null = null;
export const initializeLaunchInsets = () => {
    insetsAtLaunch = new InsetEdges;
}

export const getLaunchInsets = (): InsetEdges => {
  if (insetsAtLaunch !== null)
    return insetsAtLaunch
  return new InsetEdges();
}
