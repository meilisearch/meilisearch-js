const { MeiliSearch } = require('./meilisearch.umd')
const DefaultMeiliSearch = require('./meilisearch.umd')

const UMDtest = new MeiliSearch({ host:'http://localhost:7700', masterKey: 'masterKey'})
const DefaultUmdTest = new DefaultMeiliSearch.MeiliSearch({ host:'http://localhost:7700', masterKey: 'masterKey'})
console.log({ UMDtest, DefaultUmdTest })
