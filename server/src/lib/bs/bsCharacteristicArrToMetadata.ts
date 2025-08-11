import { BsCharacteristic } from "./BsCatalog.js";
import bsTextSmoother from "./BsSmoother.js"

export interface Metadata {
    [key: string]: string;
}

export const bsCharacteristicArrToMetadata = (chars: BsCharacteristic[]): Metadata => {
    const metadata: Metadata = {};;
    for (let i = 0; i < chars.length; ++i) {
        const char = chars[i];
        const cName = new String(char['@name']).trim();
        const text = char['#text'];
        const value = text ? bsTextSmoother(text) : null;
        metadata[cName] = value ? value : '-';
    }
    return metadata;
}