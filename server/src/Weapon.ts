import { BsProfile } from "./lib/bs/BsCatalog.js"
import { bsCharacteristicArrToMetadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";

export enum WeaponType {
    Melee = 0,
    Ranged = 1
}

export default class Weapon {
    id: string;
    name: string;
    type: number;
    Rng: string | null;
    Atk: string;
    Hit: string;
    Wnd: string;
    Rnd: string;
    Dmg: string;
    Ability: string;
    constructor(profileXml: BsProfile) {
        if (!profileXml["@typeName"].includes('Weapon')) {
            console.log(JSON.stringify(profileXml));
            throw `Invalid type for constructing Weapon: ${profileXml["@typeName"]}`;
        }

        this.id = profileXml["@id"];
        this.name = profileXml['@name'];
        const chars = profileXml.characteristics;
        this.type = WeaponType.Melee;
        if (profileXml['@typeName'] !== 'Melee Weapon')
            this.type = WeaponType.Ranged;
        
        const metadata = bsCharacteristicArrToMetadata(chars);
        this.Rng = metadata['Rng'] ? metadata['Rng'] : null;
        this.Atk = metadata['Atk'];
        this.Hit = metadata['Hit'];
        this.Wnd = metadata['Wnd'];
        this.Rnd = metadata['Rnd'];
        this.Dmg = metadata['Dmg'];
        this.Ability = metadata['Ability'];
    }
}