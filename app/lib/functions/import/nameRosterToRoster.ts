import { NameRoster } from "../../../shared-lib/NameRoster.js";
import { endpoint } from "../../endpoint.js";
import { rosterState } from "./rosterState.js";

export const nameRosterToRoster = async (nameRoster: NameRoster) => {
    const regArg = encodeURI(`${endpoint}/import`);
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

    if (result)
        result = rosterState.deserialize(result);
    return result;
}