import { ImportRoster } from "./importRoster";
import ImportOfficialRoster from "./importOfficialRoster";

export const registerAllImporters = () => {
    ImportRoster.registerImporter(new ImportOfficialRoster);
}