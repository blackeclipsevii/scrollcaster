import { NameRoster } from "@scrollcaster/shared-lib/NameRoster";
import { getEndpoint } from "@/lib/endpoint";
import { generateId } from "@/lib/functions/uniqueIdentifier";
import RosterStateConverter from "./RosterStateConvertImpl";

export const nameRosterToRoster = async (nameRoster: NameRoster) => {
    const regArg = encodeURI(`${getEndpoint()}/import`);
    let result = await fetch(regArg, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(nameRoster)
    })
    .then(response => {
        if (response.status === 200) 
            return response.json();
        else {
            console.log(`Server failed to import ${nameRoster.name}`);
            return null;
        }
    });

    if (result) {
        const rsc = new RosterStateConverter();
        result = rsc.deserialize(result, generateId());
    }

    return result;
}