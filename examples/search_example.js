const MeiliSearch = require('../')
const dataset = require('./small_movies.json')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const meili = new MeiliSearch(config)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const index = {
  uid: 'movies',
}

const addDataset = async () => {
  const indexes = await meili.listIndexes()
  const indexFound = indexes.find((i) => i.uid === index.uid)
  console.log({ indexes, indexFound })

  if (!indexFound) {
    await meili.createIndex(index.uid)
  }
  const documents = await meili.getIndex(index.uid).getDocuments()
  if (documents.length === 0) {
    const { updateId } = await meili.getIndex(index.uid).addDocuments(dataset)
    await meili.getIndex(index.uid).waitForPendingUpdate(updateId)
  }
}

;(async () => {
  await addDataset()
  const index = await meili.getIndex('movies')
  const resp = await index.search('Avengers', {
    limit: 1,
    attributesToHighlight: 'title',
  })
  console.log({ resp })
  console.log({ hit: resp.hits[0] })
})()
