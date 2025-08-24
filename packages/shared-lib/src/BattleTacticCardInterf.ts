import { Identifiable, Typed } from "./BasicObject.js";

export interface BattleTacticInterf {
    type: {
        name: string;
        index: number;
    };
    text: string;
}

export default interface BattleTacticCardInterf extends Identifiable, Typed {
    text: string;
    tactics: BattleTacticInterf[];
}