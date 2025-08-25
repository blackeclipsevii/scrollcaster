import UnitInterf from "../../../shared-lib/UnitInterface.js";
import { namesEqual } from "../helperFunctions.js";
import { getKeywordsFromOption } from "./ExtractedKeyword.js";

// companion validator
export const validateCanOnlyBeTakenIn = (leader: UnitInterf | null, unit: UnitInterf) => {
    if (unit.battleProfile) {
        const notes = unit.battleProfile.notes;
        if (notes) {
            if (notes.toLowerCase().replace(/ /g, '').includes('thisunitcanonlybetakenin')) {
                const extractedKWs = getKeywordsFromOption(notes);
                if (extractedKWs.length > 0) {
                    const extractedKW = extractedKWs[0];
                    if (!leader || !namesEqual(leader.name, extractedKW.keyword)) {
                        return `<${unit.name}> can only be taken in <${extractedKW.raw}>'s regiment`;
                    }
                }
            }
        }
    }
    return null;
}