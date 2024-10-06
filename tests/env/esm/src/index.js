import { MeiliSearch } from '../../../../dist/esm/index.js'
import { generateTenantToken } from '../../../../dist/esm/token.js'

const client = new MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey' })
const token = generateTenantToken('e489fe16-3381-431b-bee3-00430192915d', [], { apiKey: 'masterKey' })
console.log({ client, token })
