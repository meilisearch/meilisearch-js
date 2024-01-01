import { MeiliSearch } from '../../../../'
import * as DefaultMeiliSearch from '../../../../'

const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'masterKey',
})
const defaultClient = new DefaultMeiliSearch.MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'masterKey',
})
const token = client.generateTenantToken(
  'e489fe16-3381-431b-bee3-00430192915d',
  []
)
console.log({ client, token, defaultClient })
