var MeiliSearch = require('../dist')
const dataset = require('./small_movies.json')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 123,
}

var meili = new MeiliSearch(config)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const index = {
  name: 'Movies',
  uid: 'movies',
}

const addDataset = async () => {
  let resp
  resp = await meili.listIndexes()
  if (resp.length === 0) {
    resp = await meili.createIndex(index)
  }
  resp = await meili.getIndex(index.uid).getDocuments()
  if (resp.length === 0) {
    resp = await meili.getIndex(index.uid).addDocuments(dataset)
    await sleep(1000) // This is to give time to MeiliSearch to index the dataset
    // If you have no results it means it took more than 1 second to index.
  }
}

;(async () => {
  await addDataset()
  let index = await meili.getIndex('movies')
  let resp
  resp = await index.search('Avengers', {
    limit: 1,
    attributesToHighlight: 'title',
  })
  console.log({ resp })
  console.log({ r: resp.hits[0]._formatted })
})()
