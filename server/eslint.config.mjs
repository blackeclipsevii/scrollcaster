// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  // global ignores
  {
    ignores: ["**/dist/", "node_modules/", "**/*.test.js"],
  },

  // applies to everything
  eslint.configs.recommended,

  // applies only to ts files
  {
    name: "tseslint",
    files: ["server/**/*.ts"],
    extends: [
      //
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.strictTypeChecked,
    ],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
      },
    },
    rules: {
      // this rule doesn't really work
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // global variables, applies to everything
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // prettier config
  prettier
);