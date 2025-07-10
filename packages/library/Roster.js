

export default class Roster {
    constructor() {
        this.id = "";
        this.name = "";
        this.army = "";
        this.subfaction = null;
        this.points = 2000;
        this.regiments = []
        this.auxiliaryUnits = []
        this.terrainFeature = null;
        this.manifestationLore = null;
        this.spellLore = null;
    }

    general() {
        for (let i = 0; i < this.regiments.length; ++i) {
            const regiment = this.regiments[i];
            for (let j = 0; j < regiment.units.length; ++j) {
                const unit = regiment.units[j];
                if (unit.isGeneral)
                    return unit;
            }
        }

        return null;
    }

    totalPoints() {
        let total = 0;
        
        // to-do calculate this number
        this.regiments.forEach(regiment => {
            regiment.units.forEach(unit => {
                total += unit.totalPoints();
            });
        })

        this.auxiliaryUnits.forEach(unit => {
            total += unit.totalPoints();
        });

        if (this.terrainFeature)
            total += this.terrainFeature.totalPoints();

        if (this.manifestationLore)
            total += this.manifestationLore.totalPoints();
            
        if (0 && this.spellLore)
            total += this.spellLore.totalPoints();

        return total;
    }
}