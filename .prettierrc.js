// https://prettier.io/docs/en/options.html

module.exports = {
  singleQuote: true,
  // @TODO Remove as it's default
  // arrowParens: 'always',
  semi: false,
  // @TODO Remove as it's default
  // bracketSpacing: true,
  trailingComma: 'es5',
  // @TODO Remove as it's default
  // printWidth: 80,
  plugins: ['./node_modules/prettier-plugin-jsdoc/dist/index.js'],
  // https://github.com/hosseinmd/prettier-plugin-jsdoc#tsdoc
  tsdoc: true,
}
