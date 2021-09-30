import { MeiliSearch } from '../../../src/lib/meilisearch'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)
const uid = 'movies'

const addDataset = async () => {
  const index = await client.getOrCreateIndex(uid)
  const documents = await index.getDocuments()

  const dataset = [
    { id: 1, title: 'Carol', genres: ['Romance', 'Drama'] },
    { id: 2, title: 'Wonder Woman', genres: ['Action', 'Adventure'] },
    { id: 3, title: 'Life of Pi', genres: ['Adventure', 'Drama'] },
    {
      id: 4,
      title: 'Mad Max: Fury Road',
      genres: ['Adventure', 'Science Fiction'],
    },
    { id: 5, title: 'Moana', genres: ['Fantasy', 'Action'] },
    { id: 6, title: 'Philadelphia', genres: ['Drama'] },
  ]
  if (documents.length === 0) {
    const { updateId } = await index.addDocuments(dataset)
    await index.waitForPendingUpdate(updateId)
  }
}

;(async () => {
  await addDataset()
  try {
    const index = await client.getOrCreateIndex('movies')

    const resp = await index.search(
      'Moana',
      {
        limit: 1,
        attributesToHighlight: ['title'],
      },
      'POST'
    )
    console.log({ resp })
    console.log({ hit: resp.hits[0] })
  } catch (e) {
    console.error(e)
  }
})()
