module.exports = {
  env: {
    browser: true,
    es6: true,
    es2020: true,
    'jest/globals': true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2019,
    project: ['tsconfig.eslint.json'],
    sourceType: 'module',
    projectFolderIgnoreList: ['dist'],
  },
  plugins: ['jsdoc', '@typescript-eslint', 'prettier', 'jest'],
  rules: {
    'no-dupe-class-members': 'off', // Off due to conflict with typescript overload functions
    'prettier/prettier': ['error', {}, { usePrettierrc: true }],
    '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
    '@typescript-eslint/return-await': 'off',
    'jsdoc/check-alignment': 'error',
    'jsdoc/check-indentation': 'error',
    '@typescript-eslint/space-before-function-paren': 0,
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'none', // 'none' or 'semi' or 'comma'
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi', // 'semi' or 'comma'
          requireLast: false,
        },
      },
    ],
    'comma-dangle': 'off',
  },
}
