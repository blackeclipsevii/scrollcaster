import { ImportRoster } from "./importRoster.js";
import ImportOfficialRoster from "./importOfficialRoster.js";

export const registerAllImporters = () => {
    ImportRoster.registerImporter(new ImportOfficialRoster);
}