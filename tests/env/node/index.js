const { MeiliSearch } = require('../../../dist/bundles/meilisearch.cjs.js')
const DefaultMeiliSearch = require('../../../dist/bundles/meilisearch.cjs.js')

const UMDtest = new MeiliSearch({ host:'http://localhost:7700', masterKey: 'masterKey'})
const DefaultUmdTest = new DefaultMeiliSearch.MeiliSearch({ host:'http://localhost:7700', masterKey: 'masterKey'})
console.log({ UMDtest, DefaultUmdTest })

