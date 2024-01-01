const { MeiliSearch } = require('../../../')
const DefaultMeiliSearch = require('../../../')

const CJStest = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'masterKey',
})
const DefaultCJSTest = new DefaultMeiliSearch.MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'masterKey',
})

DefaultCJSTest.generateTenantToken('e489fe16-3381-431b-bee3-00430192915d', []) // Resolved using the `main` field
CJStest.generateTenantToken('e489fe16-3381-431b-bee3-00430192915d', []) // Resolved using the `main` field

console.log({ CJStest, DefaultCJSTest })
