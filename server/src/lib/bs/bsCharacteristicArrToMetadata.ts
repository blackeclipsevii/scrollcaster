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
        const value = bsTextSmoother(char['#text']);
        metadata[cName] = value ? value.toString() : '-';
    }
    return metadata;
}