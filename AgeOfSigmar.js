
import { XMLParser, XMLValidator} from "fast-xml-parser"

export default class AgeOfSigmar {
    constructor(xml) {
        this.xml = xml;
        this.isValid = true;
        this._parse();
    }

    // Removes annoying bsdata standard of wrapping every array in an object
    smooth(bsData) {
        for (const [key, value] of Object.entries(bsData)) {
            if (typeof(value) === 'object') {
                if (!Array.isArray(value) && key.endsWith('s')) {
                    if (Object.entries(value).length === 1) {
                        for (const [_, singularValue] of Object.entries(value)) {
                            if (Array.isArray(singularValue)) {
                                bsData[key] = singularValue;
                            } else {
                                bsData[key] = [singularValue];
                            }
                        }
                    }
                }

                const newValue = bsData[key];
                // recurse
                if (Array.isArray(newValue)) {
                    if (typeof(newValue[0]) === 'object') {
                        let n = newValue.length;
                        let i = 0;
                        for (; i < n; ++i) {
                            newValue[i] = this.smooth(newValue[i]);
                        }
                    }
                }
                else {
                    bsData[key] = this.smooth(newValue);
                }
            }
        }

        return bsData;
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
        this.root = this.smooth(this.root);
    }
}
