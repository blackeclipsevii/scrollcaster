import { registerBigWaaagh } from "./BigWaaagh.js";
import { registerSoulblightValidators } from "./SoulblightGravelords.js";

export const registerAllValidators = () => {
    registerSoulblightValidators();
    registerBigWaaagh();
}