const eslint = require("@eslint/js");
const tseslint = require("typescript-eslint");
const tsdoc = require("eslint-plugin-tsdoc");
const jest = require("eslint-plugin-jest");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  {
    ignores: ["dist/", "tests/env/", "coverage/", "playgrounds/", "docs/"],
  },
  // Standard linting for js files
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.node },
    plugins: { eslint },
    rules: eslint.configs.recommended.rules,
  },
  // TypeScript linting for ts files
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parser: tseslint.parser,
      parserOptions: { project: "tsconfig.eslint.json" },
    },
    plugins: { ...config.plugins, tsdoc },
    rules: {
      ...config.rules,
      "tsdoc/syntax": "error",
      // @TODO: Remove the ones between "~~", adapt code
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
      // @TODO: Should be careful with this rule, should leave it be and disable
      //       it within files where necessary with explanations
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        // argsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#argsignorepattern
        // varsIgnorePattern: https://eslint.org/docs/latest/rules/no-unused-vars#varsignorepattern
        { args: "all", argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // @TODO: Not recommended to disable rule, should instead disable locally
      //       with explanation
      "@typescript-eslint/ban-ts-ignore": "off",
    },
  })),
  // Jest linting for test files
  {
    files: ["tests/*.ts"],
    ...jest.configs["flat/recommended"],
    // languageOptions: {
    //   ...jest.configs['flat/recommended'].languageOptions,
    //   globals: globals.jest,
    // },
    rules: {
      ...jest.configs["flat/recommended"].rules,
      // @TODO: Remove all of these rules and adapt code!
      "jest/no-disabled-tests": "off",
      "jest/expect-expect": "off",
      "jest/no-conditional-expect": "off",
      "jest/valid-title": "off",
      "jest/no-jasmine-globals": "off",
      "jest/valid-expect-in-promise": "off",
      "jest/valid-expect": "off",
      "jest/no-alias-methods": "off",
    },
  },
  prettier,
];
