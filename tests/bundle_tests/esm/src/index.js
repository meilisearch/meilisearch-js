import instantMeiliSearch from '../../../dist/instant-meilisearch.esm'

console.log(instantMeiliSearch)
const client = instantMeiliSearch('http://localhost:7700', 'masterKey')
console.log({ client })
