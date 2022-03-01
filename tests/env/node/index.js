const { MeiliSearch } = require('../../../dist/bundles/meilisearch.cjs.js')
const DefaultMeiliSearch = require('../../../dist/bundles/meilisearch.cjs.js')

const CJStest = new MeiliSearch({ host:'http://localhost:7700', masterKey: 'masterKey'})
const DefaultCJSTest = new DefaultMeiliSearch.MeiliSearch({ host:'http://localhost:7700', masterKey: 'masterKey'})
console.log({ CJStest, DefaultCJSTest })

