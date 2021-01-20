import { MeiliSearch } from '../meilisearch.esm'
import * as DefaultMeiliSearch from '../meilisearch.esm'

const client = new MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey'})
const defaultClient = new DefaultMeiliSearch.MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey'})
console.log({ client, defaultClient })
