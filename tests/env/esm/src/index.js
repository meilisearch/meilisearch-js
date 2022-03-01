import { MeiliSearch } from '../../../../'
import * as DefaultMeiliSearch from '../../../../'

const client = new MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey'})
const defaultClient = new DefaultMeiliSearch.MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey'})
const token = client.generateTenantToken([])
console.log({ client, token, defaultClient })
