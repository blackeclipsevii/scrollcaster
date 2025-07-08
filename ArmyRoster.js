import { XMLParser, XMLValidator} from "fast-xml-parser"
import Weapon from "./Weapon.js"
import Unit from "./Unit.js"
import Ability from "./Ability.js"
import DataSmoother from "./DataSmoother.js";

export default class ArmyRoster {
    constructor(catalogs) {
        this.xml = xml;
        this.isValid = true;
        this._parse();
    }

    _parse() {
        const options = {
            ignoreAttributes: false,
            attributeNamePrefix : "@",
            allowBooleanAttributes: true
        };

        const result = XMLValidator.validate(this.xml, options);

        if (!result) {
            this.isValid = false;
            return;
        }

        const parser = new XMLParser(options);
        this.root = parser.parse(this.xml);
        
        const ds = new DataSmoother();

    }
}
