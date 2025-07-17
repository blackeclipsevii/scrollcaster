import { UnitType } from "./Unit.js";

export default class Roster {
    constructor(army) {
        this.army = army.name;
        this.battleTraits = army.upgrades.battleTraits;
        
        this.id = "";
        this.name = "";
        this.battleFormation = null;
        this.points = 2000;
        this.regiments = [];
        this.auxiliaryUnits = [];
        this.battleTacticCards = [];
        this.lores = {
            canHaveManifestation: true,
            manifestation: null,

            canHaveSpell: true,
            spell: null,

            canHavePrayer: true,
            prayer: null
        }
        this.terrainFeature = null;
        this.isArmyOfRenown = army.isArmyOfRenown;
        this._setDefaultValues(army);        
    }

    _setDefaultValues(army) {
        // setup defaults for army
        // MOST armies have one terrain feature, so just find it
        const unitIds = Object.getOwnPropertyNames(army.units);
        unitIds.forEach(id => {
            const unit = army.units[id];
            if (unit.type === UnitType.Terrain) {
                if (!unit.points || unit.points === 0) {
                    this.terrainFeature = unit;
                }
            }
        });

        let names = Object.getOwnPropertyNames(army.upgrades.lores.spell);
        if (names.length === 1)
            this.lores.spell = army.upgrades.lores.spell[names[0]];
        else if (names.length === 0)
            this.lores.canHaveSpell = false;

        names = Object.getOwnPropertyNames(army.upgrades.lores.prayer);
        if (names.length === 1)
            this.lores.prayer = army.upgrades.lores.prayer[names[0]];
        else if (names.length === 0)
            this.lores.canHavePrayer = false;
    }
}