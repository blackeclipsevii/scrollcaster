import fs from 'fs'
import { XMLParser, XMLValidator} from "fast-xml-parser"
import { bsLayoutSmoother } from './bs/BsSmoother.js';
import { BsCatalog, BsLibrary, BsGameSystem } from './bs/BsCatalog.js';

export default function parseCatalog(path: string): BsCatalog | BsLibrary | null {
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
    let root = parser.parse(xmlContent) as {[name:string]: unknown} | null;
    if (!root)
        return null;
    
    root = bsLayoutSmoother(root);
    return root.catalogue as BsCatalog | BsLibrary;
}

export function parseGameSystem(path: string): BsGameSystem | null{
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
    let root = parser.parse(xmlContent) as {[name: string]: unknown};
    if (!root)
        return null;
    
    root = bsLayoutSmoother(root);
    return root.gameSystem as BsGameSystem;
}