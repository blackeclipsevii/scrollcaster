
export const UnitType = {
    Hero: 0,
    Infantry: 1,
    Cavalry: 2,
    Beast: 3,
    Monster: 4,
    WarMachine: 5,
    Manifestation: 6,
    Terrain: 7,
    Unknown: 99
}

export function strToUnitType(str) {
    const upper = str.toUpperCase();
    if (upper === 'HERO') {
        return UnitType.Hero;
    } else if (upper === 'INFANTRY') {
        return UnitType.Infantry;
    } else if (upper === 'CAVALRY') {
        return UnitType.Cavalry;
    } else if (upper === 'BEAST') {
        return UnitType.Beast;
    } else if (upper === 'MONSTER') {
        return UnitType.Monster;
    } else if (upper === 'WAR MACHINE') {
        return UnitType.WarMachine;
    } else if (upper === 'MANIFEST') {
        return UnitType.Manifestation;
    } else if (upper === 'FACTION TERRAIN') {
        return UnitType.Terrain;
    }
    return UnitType.Unknown;
}
