import { MeiliSearch } from '../../../src/lib/meilisearch'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)
const indexUid = 'movies'

const addDataset = async () => {
  const index = await client.deleteIndex(indexUid)
  const { uid } = await client.createIndex(indexUid)
  await index.waitForTask(uid)

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
    const task = await index.addDocuments(dataset)
    await index.waitForPendingUpdate(task.uid)
  }
}

;(async () => {
  try {
    await addDataset()
    const indexes = await client.getRawIndexes()
    document.querySelector('.indexes').innerText = JSON.stringify(
      indexes,
      null,
      2
    )
    const resp = await client.index(indexUid).search(
      '',
      {
        attributesToHighlight: ['title'],
      },
      'POST'
    )
    console.log({ resp })
    console.log({ hit: resp.hits[0] })
    document.querySelector('.hits').innerText = JSON.stringify(
      resp.hits,
      null,
      2
    )
    document.querySelector('.errors_title').style.display = 'none'
  } catch (e) {
    console.error(e)
    document.querySelector('.errors').innerText = JSON.stringify(e, null, 2)
  }
})()
