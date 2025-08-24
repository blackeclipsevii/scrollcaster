import { registerJsonValidators } from "../ArmyValidator.js";
import { registerBigWaaagh } from "./BigWaaagh.js";
import { registerCroneseersPariahs } from "./CroneseersPariahs.js";
import { registerDaKingsGitz } from "./DaKingsGitz.js";
import { registerMurkvastMenagerie } from "./MurkvastMenagerie.js";
import { registerPyrofaneCult } from "./PyrofaneCult.js";
import { registerWardensOfTheChorrileum } from "./WardensOfTheChorrileum.js";

export const registerAllValidators = () => {
    registerJsonValidators('./resources/validators.json');

    // more involved validators
    registerCroneseersPariahs();
    registerBigWaaagh();
    registerDaKingsGitz();
    registerMurkvastMenagerie();
    registerPyrofaneCult();
    registerWardensOfTheChorrileum();
}