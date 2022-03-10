const { MeiliSearch } = require('../../../')
const DefaultMeiliSearch = require('../../../')

const CJStest = new MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey'})
const DefaultCJSTest = new DefaultMeiliSearch.MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey'})

DefaultCJSTest.generateTenantToken([]) // Resolved using the `main` field
CJStest.generateTenantToken([]) // Resolved using the `main` field

console.log({ CJStest, DefaultCJSTest })
