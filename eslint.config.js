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
      "@typescript-eslint/no-unused-vars": [
        "error",
        // argsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#argsignorepattern
        // varsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#varsignorepattern
        { args: "all", argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  // Vitest
  {
    files: ["tests/**/*.test.ts"],
    extends: [vitest.configs.recommended],
    rules: {
      "vitest/expect-expect": [
        "error",
        { assertFunctionNames: ["t.expect", "expect", "assert"] },
      ],
    },
  },
  // Disable any style linting, as prettier takes care of that separately
  prettier,
]);
