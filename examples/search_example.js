var Meili = require('../dist')
const dataset = require('./small_movies.json')

const config = {
  host: 'http://127.0.0.1:7700',
}

var meili = new Meili(config)

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
  resp = await meili.Index(index.uid).getDocuments()
  if (resp.length === 0) {
    resp = await meili.Index('movies').addDocuments(dataset)
    await sleep(1000) // This is to give time to MeiliSearch to index the dataset
    // If you have no results it means it took more than 1 second to index.
  }
}

;(async () => {
  await addDataset()
  let resp
  resp = await meili.Index('movies').search('Avengers')
  console.log({ resp })
})()
