import MeiliSearch from '../meilisearch.esm'

console.log(MeiliSearch)
const client = new MeiliSearch({ host:'http://localhost:7700', apiKey: 'masterKey'})
console.log({ client })
