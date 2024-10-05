const { MeiliSearch } = require('../../../dist/bundles/index.cjs')
const { generateTenantToken } = require('../../../dist/bundles/token.cjs')

const CJStest = new MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey' })

generateTenantToken('e489fe16-3381-431b-bee3-00430192915d', [], { apiKey: 'masterKey' })

console.log({ CJStest })
