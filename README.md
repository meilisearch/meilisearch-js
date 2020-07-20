<p align="center">
  <img src="https://res.cloudinary.com/meilisearch/image/upload/v1587402338/SDKs/meilisearch_js.svg" alt="MeiliSearch-JavaScript" width="200" height="200" />
</p>

<h1 align="center">MeiliSearch JavaScript</h1>

<h4 align="center">
  <a href="https://github.com/meilisearch/MeiliSearch">MeiliSearch</a> |
  <a href="https://www.meilisearch.com">Website</a> |
  <a href="https://blog.meilisearch.com">Blog</a> |
  <a href="https://twitter.com/meilisearch">Twitter</a> |
  <a href="https://docs.meilisearch.com">Documentation</a> |
  <a href="https://docs.meilisearch.com/faq">FAQ</a>
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/meilisearch"><img src="https://img.shields.io/npm/v/meilisearch.svg" alt="NPM version"></a>
  <a href="https://github.com/conventional-changelog/standard-version"><img src="https://img.shields.io/badge/release-standard%20version-brightgreen.svg" alt="Standard Version"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://slack.meilisearch.com"><img src="https://img.shields.io/badge/slack-MeiliSearch-blue.svg?logo=slack" alt="Slack"></a>
</p>

<p align="center">⚡ Lightning Fast, Ultra Relevant, and Typo-Tolerant Search Engine MeiliSearch client written in JavaScript</p>

**MeiliSearch JavaScript** is a client for **MeiliSearch** written in JavaScript. **MeiliSearch** is a powerful, fast, open-source, easy to use and deploy search engine. Both searching and indexing are highly customizable. Features such as typo-tolerance, filters, and synonyms are provided out-of-the-box.

## Table of Contents <!-- omit in toc -->

- [🔧 Installation](#-installation)
- [🎬 Getting started](#-getting-started)
- [🤖 Compatibility with MeiliSearch](#-compatibility-with-meilisearch)
- [🎬 Examples](#-examples)
  - [Indexes](#indexes)
  - [Documents](#documents)
  - [Update status](#update-status)
  - [Search](#search)
- [⚙️ Development Workflow and Contributing](#️-development-workflow-and-contributing)
- [📜 API Resources](#-api-resources)

## 🔧 Installation

```sh
npm install meilisearch
```

```sh
yarn add meilisearch
```

### 🏃‍♀️ Run MeiliSearch <!-- omit in toc -->

There are many easy ways to [download and run a MeiliSearch instance](https://docs.meilisearch.com/guides/advanced_guides/installation.html#download-and-launch).

For example, if you use Docker:

```bash
$ docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest ./meilisearch --master-key=masterKey
```

NB: you can also download MeiliSearch from **Homebrew** or **APT**.

### Import <!-- omit in toc -->

#### Front End or ESmodule <!-- omit in toc -->

```javascript
import MeiliSearch from 'meilisearch'

const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
  })
```

#### HTML Import <!-- omit in toc -->

```javascript
<script src="https://cdn.jsdelivr.net/npm/meilisearch@latest/dist/bundles/meilisearch.browser.js"></script>
<script>
  const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
  })
  client.listIndexes().then(res => {
    console.log({ res });
  })
</script>
```

#### Back-End CommonJs <!-- omit in toc -->

```javascript
const MeiliSearch = require('meilisearch');

const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
  })
```

## 🎬 Getting started

Here is a quickstart for a search request

```js
const MeiliSearch = require('meilisearch')
// Or if you are on a front-end environment:
import MeiliSearch from 'meilisearch'
;(async () => {
  const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
  })

  const index = await client.createIndex('books') // If your index does not exist
  // OR
  const index = client.getIndex('books') // If your index exists

  const documents = [
    { book_id: 123, title: 'Pride and Prejudice' },
    { book_id: 456, title: 'Le Petit Prince' },
    { book_id: 1, title: 'Alice In Wonderland' },
    { book_id: 1344, title: 'The Hobbit' },
    { book_id: 4, title: 'Harry Potter and the Half-Blood Prince' },
    { book_id: 42, title: "The Hitchhiker's Guide to the Galaxy" },
  ]

  let response = await index.addDocuments(documents)
  console.log(response) // => { "updateId": 0 }
})()
```

With the `updateId`, you can check the status (`processed` or `failed`) of your documents addition thanks to this [method](#update-status).

#### Search in index <!-- omit in toc -->

```javascript
// MeiliSearch is typo-tolerant:
const search = await index.search('harry pottre')
console.log(search)
```

Output:

```json
{
  "hits": [
    {
      "book_id": 4,
      "title": "Harry Potter and the Half-Blood Prince"
    }
  ],
  "offset": 0,
  "limit": 20,
  "processingTimeMs": 1,
  "query": "harry pottre"
}
```

## 🤖 Compatibility with MeiliSearch

This package is compatible with the following MeiliSearch versions:

- `v0.13.X`

## 🎬 Examples

All HTTP routes of MeiliSearch are accessible via methods in this SDK.</br>
You can check out [the API documentation](https://docs.meilisearch.com/references/).

Go checkout [examples](./examples)!

In this section, the examples contain the [`await` keyword](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

### Indexes

#### Create an index <!-- omit in toc -->

```javascript
// Create an index
const index = await client.createIndex('books')
// Create an index and give the primary-key
const index = await client.createIndex('books', { primaryKey: 'book_id' })
```

#### List all indexes <!-- omit in toc -->

```javascript
const indexes = await client.listIndexes()
```

#### Get an index object <!-- omit in toc -->

```javascript
const index = client.getIndex('books')
```

### Documents

#### Fetch documents <!-- omit in toc -->

```javascript
// Get one document
const document = await index.getDocument(123)

// Get documents by batch
const documents = await index.getDocuments({ offset: 4, limit: 20 })
```

#### Add documents <!-- omit in toc -->

```javascript
await index.addDocuments([{ book_id: 2, title: 'Madame Bovary' }])
```

Response:

```json
{
  "updateId": 1
}
```

With this `updateId` you can track your [operation update](#update-status).

#### Delete documents <!-- omit in toc -->

```javascript
// Delete one document
await index.deleteDocument(2)
// Delete several documents
await index.deleteDocuments([1, 42])
// Delete all documents /!\
await index.deleteAllDocuments()
```

### Update status

```javascript
// Get one update
// Parameter: the updateId got after an asynchronous request (e.g. documents addition)
await index.getUpdateStatus(1)
// Get all update satus
await index.getAllUpdateStatus()
```

### Search

#### Basic search <!-- omit in toc -->

```javascript
const search = await index.search('prince')
```

```json
{
  "hits": [
    {
      "book_id": 456,
      "title": "Le Petit Prince"
    },
    {
      "book_id": 4,
      "title": "Harry Potter and the Half-Blood Prince"
    }
  ],
  "offset": 0,
  "limit": 20,
  "processingTimeMs": 13,
  "query": "prince"
}
```

#### Custom search <!-- omit in toc -->

All the supported options are described in [this documentation section](https://docs.meilisearch.com/references/search.html#search-in-an-index).

```javascript
await index.search('prince', { limit: 1, attributesToHighlight: '*' })
```

```json
{
  "hits": [
    {
      "book_id": 456,
      "title": "Le Petit Prince",
      "_formatted": {
        "book_id": 456,
        "title": "Le Petit <em>Prince</em>"
      }
    }
  ],
  "offset": 0,
  "limit": 1,
  "processingTimeMs": 0,
  "query": "prince"
}
```

## ⚙️ Development Workflow and Contributing

Any new contribution is more than welcome in this project!

If you want to know more about the development workflow or want to contribute, please visit our [contributing guidelines](/CONTRIBUTING.md) for detailed instructions!

## 📜 API Resources

### Search <!-- omit in toc -->

- Make a search request:

`client.getIndex<T>('xxx').search(query: string, options?: SearchParams): Promise<SearchResponse<T>>`

### Indexes <!-- omit in toc -->

- List all indexes:

`client.listIndexes(): Promise<IndexResponse[]>`

- Create new index:

`client.createIndex<T>(uid: string, options?: IndexOptions): Promise<Index<T>>`

- Get index object:

`client.getIndex<T>(uid: string): Index<T>`

- Get or create index if it does not exist

`client.getOrCreateIndex<T>(uid: string, options?: IndexOptions): Promise<Index<T>>`

- Show Index information:

`index.show(): Promise<IndexResponse>`

- Update Index:

`index.updateIndex(data: IndexOptions): Promise<IndexResponse>`

- Delete Index:

`index.deleteIndex(): Promise<void>`

- Get specific index stats

`index.getStats(): Promise<IndexStats>`

### Updates <!-- omit in toc -->

- Get One update info:

`index.getUpdateStatus(updateId: number): Promise<Update>`

- Get all updates info:

`index.getAllUpdateStatus(): Promise<Update[]>`

- Wait for pending update:

`index.waitForPendingUpdate(updateId: number, { timeOutMs?: number, intervalMs?: number }): Promise<Update>`

### Documents <!-- omit in toc -->

- Add or replace multiple documents:

`index.addDocuments(documents: Document<T>[]): Promise<EnqueuedUpdate>`

- Add or update multiple documents:

`index.updateDocuments(documents: Document<T>[]): Promise<EnqueuedUpdate>`

- Get Documents:

`index.getDocuments(params: getDocumentsParams): Promise<Document<T>[]>`

- Get one document:

`index.getDocument(documentId: string): Promise<Document<T>>`

- Delete one document:

`index.deleteDocument(documentId: string | number): Promise<EnqueuedUpdate>`

- Delete multiple documents:

`index.deleteDocuments(documentsIds: string[] | number[]): Promise<EnqueuedUpdate>`

- Delete all documents:
  `index.deleteAllDocuments(): Promise<Types.EnqueuedUpdate>`

### Settings <!-- omit in toc -->

- Get settings:

`index.getSettings(): Promise<Settings>`

- Update settings:

`index.updateSettings(settings: Settings): Promise<EnqueuedUpdate>`

- Reset settings:

`index.resetSettings(): Promise<EnqueuedUpdate>`

### Synonyms <!-- omit in toc -->

- Get synonyms:

`index.getSynonyms(): Promise<object>`

- Update synonyms:

`index.updateSynonym(synonyms: object): Promise<EnqueuedUpdate>`

- Reset synonyms:

`index.resetSynonym(): Promise<EnqueuedUpdate>`

### Stop-words <!-- omit in toc -->

- Get Stop Words
  `index.getStopWords(): Promise<string[]>`

- Update Stop Words
  `index.updateStopWords(string[]): Promise<EnqueuedUpdate>`

- Reset Stop Words
  `index.resetStopWords(): Promise<EnqueuedUpdate>`

### Ranking rules <!-- omit in toc -->

- Get Ranking Rules
  `index.getRankingRules(): Promise<string[]>`

- Update Ranking Rules
  `index.updateRankingRules(rankingRules: string[]): Promise<EnqueuedUpdate>`

- Reset Ranking Rules
  `index.resetRankingRules(): Promise<EnqueuedUpdate>`

### Distinct Attribute <!-- omit in toc -->

- Get Distinct Attribute
  `index.getDistinctAttribute(): Promise<string | void>`

- Update Distinct Attribute
  `index.updateDistinctAttribute(distinctAttribute: string): Promise<EnqueuedUpdate>`

- Reset Distinct Attribute
  `index.resetDistinctAttribute(): Promise<EnqueuedUpdate>`

### Searchable Attributes <!-- omit in toc -->

- Get Searchable Attributes
  `index.getSearchableAttributes(): Promise<string[]>`

- Update Searchable Attributes
  `index.updateSearchableAttributes(searchableAttributes: string[]): Promise<EnqueuedUpdate>`

- Reset Searchable Attributes
  `index.resetSearchableAttributes(): Promise<EnqueuedUpdate>`

### Displayed Attributes <!-- omit in toc -->

- Get Displayed Attributes
  `index.getDisplayedAttributes(): Promise<string[]>`

- Update Displayed Attributes
  `index.updateDisplayedAttributes(displayedAttributes: string[]): Promise<EnqueuedUpdate>`

- Reset Displayed Attributes
  `index.resetDisplayedAttributes(): Promise<EnqueuedUpdate>`

### Accept new fields <!-- omit in toc -->

- Get Accept new fields
  `index.getAcceptNewFields(): Promise<boolean>`

- Update Accept new fields
  `index.updateAcceptNewFields(acceptNewFields: boolean): Promise<EnqueuedUpdate>`

### Keys <!-- omit in toc -->

- Get keys

`client.getKeys(): Promise<Keys>`

### Healthy <!-- omit in toc -->

- Check if the server is healthy

`client.isHealthy(): Promise<void>`

### Stats <!-- omit in toc -->

- Get database stats

`client.stats(): Promise<Stats>`

### Version <!-- omit in toc -->

- Get binary version

`client.version(): Promise<Version>`

### System <!-- omit in toc -->

- Get system information

`client.systemInformation(): Promise<SysInfo>`

- Get system information (pretty mode)

`client.systemInformationPretty(): Promise<SysInfoPretty>`

<hr>

**MeiliSearch** provides and maintains many **SDKs and Integration tools** like this one. We want to provide everyone with an **amazing search experience for any kind of project**. If you want to contribute, make suggestions, or just know what's going on right now, visit us in the [integration-guides](https://github.com/meilisearch/integration-guides) repository.
