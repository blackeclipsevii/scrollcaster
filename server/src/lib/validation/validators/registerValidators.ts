import { registerJsonValidators } from "../ArmyValidator.js";
import { registerBigWaaagh } from "./BigWaaagh.js";
import { registerDaKingsGitz } from "./DaKingsGitz.js";
import { registerMurkvastMenagerie } from "./MurkvastMenagerie.js";
import { registerPyrofaneCult } from "./PyrofaneCult.js";
import { registerWardensOfTheChorrileum } from "./WardensOfTheChorrileum.js";

export const registerAllValidators = () => {
    registerJsonValidators('./server/resources/validators.json');

    // more involved validators
    registerBigWaaagh();
    registerDaKingsGitz();
    registerMurkvastMenagerie();
    registerPyrofaneCult();
    registerWardensOfTheChorrileum();
}