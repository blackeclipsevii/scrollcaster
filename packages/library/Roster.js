

export default class Roster {
    constructor() {
        this.name = "";
        this.army = "";
        this.points = 2000;
        this.regiments = []
        this.auxiliaryUnits = []
    }

    getPoints() {
        // to-do calculate this number
        return this.points;
    }
}