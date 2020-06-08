var MeiliSearch = require('../')

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

var meili = new MeiliSearch(config)

const index = {
  uid: 'movies_test',
}

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
  try {
    await meili.createIndex(index)
    await meili.getIndex(index.uid).addDocuments(dataset)
  }
  catch (e) {
    console.error(e);

  }
})()
