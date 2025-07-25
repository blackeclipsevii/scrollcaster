import fs from 'fs'
import { XMLParser, XMLValidator} from "fast-xml-parser"
import { bsLayoutSmoother } from './BsSmoother.js';

export default function parseCatalog(path) {
    const xmlContent = fs.readFileSync(path, 'utf8');
    const options = {
        ignoreAttributes: false,
        attributeNamePrefix : "@",
        allowBooleanAttributes: true
    };
    
    const result = XMLValidator.validate(xmlContent, options);
    if (!result)
        return null;

    const parser = new XMLParser(options);
    let root = parser.parse(xmlContent);
    root = bsLayoutSmoother(root);
    return root.catalogue;
}