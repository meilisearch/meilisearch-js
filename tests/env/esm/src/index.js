import { MeiliSearch } from '../../../../'
import * as DefaultMeiliSearch from '../../../../'
import { generateTenantToken } from '../../../../dist/bundles/token.mjs'

const client = new MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey' })
const defaultClient = new DefaultMeiliSearch.MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey' })
const token = generateTenantToken('e489fe16-3381-431b-bee3-00430192915d', [], { apiKey: 'masterKey' })
console.log({ client, token, defaultClient })
