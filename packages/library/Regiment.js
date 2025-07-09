
export default class Regiment {
    constructor () {
        this.units = [];
    }

    generalsRegiment() {
        return this.general != null;
    }

    isFull() {
        maxSize = this.generalsRegiment() ? 4 : 2;
        return this.units.length > maxSize;
    }
}