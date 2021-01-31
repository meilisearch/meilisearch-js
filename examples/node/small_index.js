const { MeiliSearch } = require('../../dist/bundles/meilisearch.umd.js')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)

const uid = 'movies_test'

const dataset = [
  { id: 123, title: 'Pride and Prejudice', comment: 'A great book' },
  {
    id: 456,
    title: 'Le Petit Prince',
    comment: 'A french book about a prince that walks on little cute planets',
  },
  { id: 2, title: 'Le Rouge et le Noir', comment: 'Another french book' },
  { id: 1, title: 'Alice In Wonderland', comment: 'A weird book' },
  { id: 1344, title: 'The Hobbit', comment: 'An awesome book' },
  {
    id: 4,
    title: 'Harry Potter and the Half-Blood Prince',
    comment: 'The best book',
  },
  { id: 42, title: "The Hitchhiker's Guide to the Galaxy" },
]

;(async () => {
  // This example creates an index with 7 documents
  const index = await client.getOrCreateIndex(uid)
  const { updateId } = await index.addDocuments(dataset)
  const res = await index.waitForPendingUpdate(updateId)
  console.log({ res })
})()
