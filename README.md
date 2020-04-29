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
  <a href="https://docs.meilisearch.com/resources/faq.html">FAQ</a>
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
- [🚀 Getting started](#-getting-started)
- [🎬 Examples](#-examples)
  - [Indexes](#indexes)
  - [Documents](#documents)
  - [Update status](#update-status)
  - [Search](#search)
- [🤖 Compatibility with MeiliSearch](#-compatibility-with-meilisearch)

## 🔧 Installation

```sh
npm install meilisearch
```

```sh
yarn add meilisearch
```

### 🏃‍♀️ Run MeiliSearch

There are many easy ways to [download and run a MeiliSearch instance](https://docs.meilisearch.com/guides/advanced_guides/installation.html#download-and-launch).

For example, if you use Docker:

```bash
$ docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest --master-key=masterKey
```

NB: you can also download MeiliSearch from **Homebrew** or **APT**.

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

  const index = await client.createIndex({ uid: 'books' }) // If your index does not exists
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

#### Search in index

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

## 🎬 Examples

All HTTP routes of MeiliSearch are accessible via methods in this SDK.</br>
You can check out [the API documentation](https://docs.meilisearch.com/references/).

Go checkout [examples](./examples)!

In this section, the examples contain the [`await` keyword](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).

### Indexes

#### Create an index <!-- omit in toc -->

```javascript
// Create an index
const index = await client.createIndex({ uid: 'books' })
// Create an index and give the primary-key
const index = await client.createIndex({ uid: 'books', primaryKey: 'book_id' })
```

#### List all indexes <!-- omit in toc -->

```javascript
const indexes = await client.listIndexes()
```

#### Get an index object <!-- omit in toc -->

```javascript
const index = await client.getIndex('books')
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

## ⚙️ Development Workflow

If you want to contribute, this sections describes the steps to follow.

Thank you for your interest in a MeiliSearch tool! ♥️

### Install dependencies

```bash
$ yarn --dev
```

### Tests and Linter

Each PR should pass the tests and the linter to be accepted.

```bash
# Tests
$ docker run -d -p 7700:7700 getmeili/meilisearch:latest ./meilisearch --master-key=masterKey --no-analytics
$ yarn test
# Linter
$ yarn style
# Linter with fixing
$ yarn style:fix
# Build the project
$ yarn build
```

### Release

MeiliSearch tools follow the [Semantic Versioning Convention](https://semver.org/).

You must do a PR modifying the file `package.json` with the right version.<br>

```javascript
"version": X.X.X
```

Once the changes are merged on `master`, in your terminal, you must be on the `master` branch and push a new tag with the right version:

```bash
$ git checkout master
$ git pull origin master
$ git tag vX.X.X
$ git push --tag origin master
```

A GitHub Action will be triggered and push the package on [npm](https://www.npmjs.com/package/meilisearch).

## 🤖 Compatibility with MeiliSearch

This package works for MeiliSearch `>=0.10.x`.

## 📜 API Resources

### Search

- Make a search request:

`client.getIndex('xxx').search(query: string, options?: SearchParams): Promise<SearchResponse>`

### Indexes

- List all indexes:

`client.listIndexes(): Promise<IndexResponse[]>`

- Create new index:

`client.createIndex(data: IndexRequest): Promise<Index>`

- Get index object:

`client.getIndex(uid: string): Indexes`

- Show Index information:

`index.show(): Promise<IndexResponse>`

- Update Index:

`index.updateIndex(data: UpdateIndexRequest): Promise<IndexResponse>`

- Delete Index:

`index.deleteIndex(): Promise<void>`

- Get specific index stats

`index.getStats(): Promise<IndexStats>`

### Updates

- Get One update info:

`index.getUpdateStatus(updateId: number): Promise<Update>`

- Get all updates info:

`index.getAllUpdateStatus(): Promise<Update[]>`

- Wait for pending update:

`index.waitForPendingUpdate(updateId: number, { timeOutMs?: number, intervalMs?: number }): Promise<Update>`

### Documents

- Add or replace multiple documents:

`index.addDocuments(documents: object[]): Promise<EnqueuedUpdate>`

- Add or update multiple documents:

`index.updateDocuments(documents: object[]): Promise<EnqueuedUpdate>`

- Get Documents:

`index.getDocuments(params: getDocumentsParams): Promise<object[]>`

- Get one document:

`index.getDocument(documentId: string): Promise<object>`

- Delete one document:

`index.deleteDocument(documentId: string): Promise<EnqueuedUpdate>`

- Delete multiple documents:

`index.deleteDocuments(documentsIds: string[]): Promise<EnqueuedUpdate>`

### Settings

- Get settings:

`index.getSettings(): Promise<Settings>`

- Update settings:

`index.updateSettings(settings: Settings): Promise<EnqueuedUpdate>`

- Reset settings:

`index.resetSettings(): Promise<EnqueuedUpdate>`

### Synonyms

- Get synonyms:

`index.getSynonyms(): Promise<object>`

- Update synonyms:

`index.updateSynonym(synonyms: object): Promise<EnqueuedUpdate>`

- Reset synonyms:

`index.resetSynonym(): Promise<EnqueuedUpdate>`

### Stop-words

- Get Stop Words
  `index.getStopWords(): Promise<string[]>`

- Update Stop Words
  `index.updateStopWords(string[]): Promise<EnqueuedUpdate>`

- Reset Stop Words
  `index.updateStopWords(): Promise<EnqueuedUpdate>`

### Ranking rules

- Get Ranking Rules
  `index.getRankingRules(): Promise<string[]>`

- Update Ranking Rules
  `index.updateRankingRules(rankingRules: string[]): Promise<EnqueuedUpdate>`

- Reset Ranking Rules
  `index.resetRankingRules(): Promise<EnqueuedUpdate>`

### Distinct Attribute

- Get Distinct Attribute
  `index.getDistinctAttribute(): Promise<string | void>`

- Update Distinct Attribute
  `index.updateDistinctAttribute(distinctAttribute: string): Promise<EnqueuedUpdate>`

- Reset Distinct Attribute
  `index.resetDistinctAttribute(): Promise<EnqueuedUpdate>`

### Searchable Attributes

- Get Searchable Attributes
  `index.getSearchableAttributes(): Promise<string[]>`

- Update Searchable Attributes
  `index.updateSearchableAttributes(searchableAttributes: string[]): Promise<EnqueuedUpdate>`

- Reset Searchable Attributes
  `index.resetSearchableAttributes(): Promise<EnqueuedUpdate>`

### Displayed Attributes

- Get Displayed Attributes
  `index.getDisplayedAttributes(): Promise<string[]>`

- Update Displayed Attributes
  `index.updateDisplayedAttributes(displayedAttributes: string[]): Promise<EnqueuedUpdate>`

- Reset Displayed Attributes
  `index.resetDisplayedAttributes(): Promise<EnqueuedUpdate>`

### Accept new fields

- Get Accept new fields
  `index.getAcceptNewFields(): Promise<boolean>`

- Update Accept new fields
  `index.updateAcceptNewFields(acceptNewFields: boolean): Promise<EnqueuedUpdate>`

### Healthy

- Check if the server is healthy

`client.isHealthy(): Promise<void>`

### Stats

- Get database stats

`client.stats(): Promise<Stats>`

### Version

- Get binary version

`client.version(): Promise<Version>`

### System

- Get system information

`client.systemInformation(): Promise<SysInfo>`

- Get system information (pretty mode)

`client.systemInformationPretty(): Promise<SysInfoPretty>`
