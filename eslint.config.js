import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import tsdoc from "eslint-plugin-tsdoc";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";
import prettier from "eslint-config-prettier";

export default tseslint.config([
  { ignores: ["dist/", "tests/env/", "coverage/", "playgrounds/", "docs/"] },
  eslint.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: { globals: globals.node },
  },
  // TSDoc
  {
    files: ["src/**/*.ts"],
    plugins: { tsdoc },
    rules: { "tsdoc/syntax": "error" },
  },
  // TypeScript
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // TODO: Remove the ones between "~~", adapt code
      // ~~
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-floating-promises": "off",
      // ~~
      "@typescript-eslint/array-type": ["warn", { default: "array-simple" }],
      // TODO: Should be careful with this rule, should leave it be and disable
      //       it within files where necessary with explanations
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        // argsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#argsignorepattern
        // varsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#varsignorepattern
        { args: "all", argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // TODO: Not recommended to disable rule, should instead disable locally
      //       with explanation
      "@typescript-eslint/ban-ts-ignore": "off",
    },
  },
  // Vitest
  {
    files: ["tests/**/*.test.ts"],
    extends: [vitest.configs.recommended],
  },
  // Disable any style linting, as prettier takes care of that separately
  prettier,
]);
