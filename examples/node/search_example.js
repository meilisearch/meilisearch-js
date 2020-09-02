const MeiliSearch = require('../../dist/bundles/meilisearch.umd.js')
const dataset = require('./small_movies.json')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)
const uid = 'movies'

const addDataset = async () => {
  const index = await client.getOrCreateIndex(uid)
  const documents = await index.getDocuments()
  if (documents.length === 0) {
    const { updateId } = await index.addDocuments(dataset)
    await index.waitForPendingUpdate(updateId)
  }
}

;(async () => {
  await addDataset()
  const index = await client.getIndex('movies')
  const resp = await index.search('Avengers', {
    limit: 1,
    attributesToHighlight: ['title'],
  }, 'GET')
  console.log({ resp })
  console.log({ hit: resp.hits[0] })
})()
