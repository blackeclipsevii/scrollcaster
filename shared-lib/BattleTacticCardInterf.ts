
export const BattleTacticType = {
    Affray: 0,
    Strike: 1,
    Domination: 2
}

export interface BattleTacticInterf {
    type: {
        name: string;
        index: number;
    };
    text: string;
}

export default interface BattleTacticCardInterf {
    name: string;
    id: string;
    text: string;
    tactics: BattleTacticInterf[];
}