import Roster, { Regiment } from "../../Roster.js"
import { RegimentValidator } from "./RegimentValidation.js";

const formatMessageText = (message: string) => {
    return message.replace(/</g, "#")
                  .replace(/>/g, '%')
                  .replace(/#/g, '<b>')
                  .replace(/%/g, '</b>');
}

const regimentErrorMessage = (regiment: Regiment, errors: string | string[]) => {
    const origText = typeof errors === 'string' ? errors : (errors as string[]).join(', ');
    if (!regiment.leader)
        return origText;
    return `${formatMessageText(origText)} for <b>${regiment.leader.name}</b>'s regiment.`;
}

export const validateRoster = (roster: Roster, availableKeywords: string[]) => {
    let armyErrs: string[]= [];
    roster.regiments.forEach(reg => {
        const regErrs = RegimentValidator.validateRegiment(reg, availableKeywords);
        if (regErrs && regErrs.length > 0) {
            const errMsg = regimentErrorMessage(reg, regErrs);
            armyErrs.push(errMsg);
        }
    });
    return armyErrs;
}