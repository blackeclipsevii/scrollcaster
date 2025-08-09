
export default interface AbilityInterf {
    name: string;
    id: string;
    metadata: {[key: string]: string};
    type: number;
    cost: number | null;
}