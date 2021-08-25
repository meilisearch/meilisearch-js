import './style.css'
import { MeiliSearch } from '../../src/meilisearch'
import dataset from '../../assets/small_movies.json'

const INDEX = 'js_playground'
const client = new MeiliSearch({
  host: 'http://localhost:7700',
  apiKey: 'masterKey',
})

const publicKey = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: '3b3bf839485f90453acc6159ba18fbed673ca88523093def11a9b4f4320e44a5',
})

async function sleep(ms) {
  return await new Promise((resolve) => setTimeout(resolve, ms))
}

;(async () => {
  // Delete if exist
  try {
    await client.index(INDEX).delete()
  } catch (e) {
    console.log('nop')
  }
  // index instance
  const index = client.index(INDEX)

  // add documents
  const { updateId } = await index.addDocuments(dataset)
  await index.waitForPendingUpdate(updateId)

  // wait for
  await sleep(1000)

  // documents
  const documents = await index.getDocuments()

  // indexes
  const indexes = await client.listIndexes()

  // search response
  const response = await publicKey.index(INDEX).search('the')

  console.log({
    indexes,
    documents,
    response,
  })

  document.querySelector('#app').innerHTML = `
    <div><h2>Indexes</h2> ${indexes
      .map((index) => `\n<div>${index.name}</div>`)
      .join('')}</div> <br>
    <div><h2>Documents</h2> ${documents
      .map((doc) => `\n<div>${doc.title}</div>`)
      .slice(0, 5)
      .join('')}</div>
    <div><h2>Search</h2> ${response.hits
      .map((hit) => `\n<div>${hit.title}</div>`)
      .slice(0, 5)
      .join('')}</div>
  `
})()
