import { ImportRoster } from "./importRoster.js";
import ImportOfficialRoster from "./importOfficialRoster.js";
import ImportNewRecruitRoster from "./importNewRecruitRoster.js";
import ImportScrollcasterRoster from "./importSCRoster.js";

export const registerAllImporters = () => {
    ImportRoster.registerImporter(new ImportOfficialRoster);
    ImportRoster.registerImporter(new ImportNewRecruitRoster);
    ImportRoster.registerImporter(new ImportScrollcasterRoster);
}