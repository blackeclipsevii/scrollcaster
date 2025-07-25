import { BsProfile } from "./lib/bs/BsCatalog.js"
import { WeaponType } from "./types/WeaponType.js";
import { bsCharacteristicArrToMetadata } from "./lib/bs/bsCharacteristicArrToMetadata.js";

export default class Weapon {
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
        if (!profileXml["@typeName"].includes('Weapon'))
            throw `Invalid type for constructing Weapon: ${profileXml["@typeName"]}`;

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