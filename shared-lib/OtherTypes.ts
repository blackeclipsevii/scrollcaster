export const OtherSuperType = 'Other';

export const enum OtherTypes {
    RegimentOfRenown = 0,
    BattleTacticCard = 1,
    Unknown = 1000
}

export const otherTypesToString = (type: OtherTypes) => {
    switch(type)  {
        case OtherTypes.RegimentOfRenown:
            return 'Regiment of Renown';
        case OtherTypes.BattleTacticCard:
            return 'Battle Tactic Card';
        default:
            return 'Unknown';
    }
}