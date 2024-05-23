// https://prettier.io/docs/en/options.html

module.exports = {
  singleQuote: true,
  semi: false,
  trailingComma: 'es5',
  plugins: ['./node_modules/prettier-plugin-jsdoc/dist/index.js'],
  // https://github.com/hosseinmd/prettier-plugin-jsdoc#tsdoc
  tsdoc: true,
}
