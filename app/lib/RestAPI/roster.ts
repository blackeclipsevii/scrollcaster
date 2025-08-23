import { getUniqueIdentifier } from "@/lib/functions/uniqueIdentifier";
import { getEndpoint } from "@/lib/endpoint";
import { version } from "./version";
import { exportRoster } from "../functions/exportRoster";
import RosterInterf from "@/shared-lib/RosterInterface";
import { ImportRoster } from "../functions/import/importRoster";

var _storageName = 'rosters';

function rosterEndpoint(): string {
    const user = getUniqueIdentifier();
    return `${getEndpoint()}/roster?uuid=${user}`;
}

function _getRosters() {
    const json = localStorage.getItem(_storageName);
    if (!json)
        return {};
    return JSON.parse(json);
}

function _storeRosters(rosters: unknown) {
    const json = JSON.stringify(rosters);
    localStorage.setItem('rosters', json);
}

export async function getRosters() {
    const rosters = _getRosters();
    return Object.getOwnPropertyNames(rosters);
}

export async function getNewRoster(army: string) {
    const endpoint = rosterEndpoint();
    const roster = await fetch(encodeURI(`${endpoint}&army=${army}`), {
        method: "GET" // default, so we can ignore
    }).then(response => response.json());

    if (roster) {
        await version.stampVersion(roster);
    }

    return roster;
}

export async function getRoster(id: string): Promise<RosterInterf | null> {
    let rosters = _getRosters();
    let listOrRoster = rosters[id];
    if (listOrRoster.id !== undefined) {
        // this is an old RosterInterf and should be converted
        try {
            // this will serialize the roster into a list
            await putRoster(listOrRoster);
            rosters = _getRosters()
            listOrRoster = rosters[id];
        } catch (e) {
            // too old?
            return null;
        }
    }

    if (typeof listOrRoster !== 'string')
        return null;
    
    const result = await ImportRoster.import(listOrRoster);
    if ((result as Error).message) {
        console.log((result as Error).message);
        return null;
    }

    const roster = result as RosterInterf;
    roster.id = id;
    return roster;
}

export async function putRoster(roster: RosterInterf) {
    const rosters = _getRosters();
    rosters[roster.id] = await exportRoster(roster);
    _storeRosters(rosters);
}

export async function deleteRosters() {
  _storeRosters({});
}

export async function deleteRoster(id: string) {
    const rosters = _getRosters();
    if (rosters[id])
        delete rosters[id];
    _storeRosters(rosters);
}

