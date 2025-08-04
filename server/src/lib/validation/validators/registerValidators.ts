import { registerJsonValidators } from "../ArmyValidator.js";
import { registerBigWaaagh } from "./BigWaaagh.js";
import { registerCroneseersPariahs } from "./CroneseersPariahs.js";
import { registerDaKingsGitz } from "./DaKingsGitz.js";
import { registerMurkvastMenagerie } from "./MurkvastMenagerie.js";

export const registerAllValidators = () => {
    registerJsonValidators('./server/resources/validators.json');

    // more involved validators
    registerCroneseersPariahs();
    registerBigWaaagh();
    registerDaKingsGitz();
    registerMurkvastMenagerie();
}