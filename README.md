# MeiliSearch Javascript Client

[![NPM version](https://img.shields.io/npm/v/meilisearch.svg)](https://www.npmjs.com/package/meilisearch)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Licence](https://img.shields.io/badge/licence-MIT-blue.svg)](https://img.shields.io/badge/licence-MIT-blue.svg)

The Javascript client for MeiliSearch API.

MeiliSearch provides an ultra relevant and instant full-text search. Our solution is open-source and you can check out [our repository here](https://github.com/meilisearch/MeiliSearch).

Here is the [MeiliSearch documentation](https://docs.meilisearch.com/) 📖

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

There are many easy ways to [download and run a MeiliSearch instance](https://docs.meilisearch.com/guides/advanced_guides/binary.html#download-and-launch).

For example, if you use Docker:

```bash
$ docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest --api-key=apiKey
```

NB: you can also download MeiliSearch from **Homebrew** or **APT**.

## 🎬 Getting started

Here is a quickstart for a search request

```js
const MeiliSearch = require('meilisearch') // import MeiliSearch from 'meilisearch'

// Credentials of your MeiliSearch Instance
const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const meili = new MeiliSearch(config)

await meili.createIndex({ uid: 'books' }) // if your index does not exist

let documents = [
  { book_id: 123, title: 'Pride and Prejudice' },
  { book_id: 456, title: 'Le Petit Prince' },
  { book_id: 1, title: 'Alice In Wonderland' },
  { book_id: 1344, title: 'The Hobbit' },
  { book_id: 4, title: 'Harry Potter and the Half-Blood Prince' },
  { book_id: 42, title: "The Hitchhiker's Guide to the Galaxy" },
]

await meili.Index('books').addDocuments(documents) // { "updateId": 0 }
```

With the `updateId`, you can check the status (`processed` of `failed`) of your documents addition thanks to this [method](#update-status).

#### Search in index

```javascript
// MeiliSearch is typo-tolerant:
await meili.Index('books').search('harry pottre')
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

### Indexes

#### Create an index <!-- omit in toc -->

```javascript
// Create an index
meili.createIndex({ uid: 'books' }) // if your index does not exist
// Create an index and give the primary-key
meili.createIndex({ uid: 'books', primaryKey: 'book_id' }) // if your index does not exist
```

#### List all indexes <!-- omit in toc -->

```javascript
await meili.listIndexes()
```

#### Get an index <!-- omit in toc -->

```javascript
await meili.Index('books').getIndex()
```

### Documents

#### Fetch documents <!-- omit in toc -->

```javascript
// Get one document
let myDocument = await meili.Index('books').getDocument(123)

// Get documents by batch
let myDocuments = await meili
  .Index('books')
  .getDocuments({ offset: 4, limit: 20 })
```

#### Add documents <!-- omit in toc -->

```javascript
meili.Index('books').addDocuments([{ book_id: 2, title: 'Madame Bovary' }])
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
await meili.Index('books').deleteDocument(2)
// Delete several documents
await meili.Index('books').deleteDocuments([1, 42])
// Delete all documents /!\
await meili.Index('books').deleteAllDocuments()
```

### Update status

```javascript
// Get one update
// Parameter: the updateId got after an asynchronous request (e.g. documents addition)
await meili.Index('books').getUpdateStatus(1)
// Get all update satus
await meili.Index('books').getAllUpdateStatus()
```

### Search

#### Basic search <!-- omit in toc -->

```javascript
await meili.Index('books').search('prince')
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
await meili
  .Index('books')
  .search('prince', { limit: 1, attributesToHighlight: '*' })
```

```json
{
  "hits": [
    {
      "title": "Le Petit Prince",
      "_formatted": {
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

This package works for MeiliSearch `v0.9.x`.

## 📜 API Ressources

### Search

- Make a search request:

`meili.Index('xxx').search(query: string, options?: Types.SearchParams): Promise<Types.SearchResponse>`

### Indexes

- List all indexes:

`meili.listIndexes(): Promise<object[]>`

- Create new index:

`meili.createIndex(data: Types.CreateIndexRequest): Promise<Types.CreateIndexResponse>`

- Get Index:

`meili.Index('xxx').getIndex(): Promise<Types.index>`

- Update Index:

`meili.Index('xxx').updateIndex(data: Types.UpdateIndexRequest): Promise<Types.index>`

- Delete Index:

`meili.Index('xxx').deleteIndex(): Promise<void>`

- Get specific index stats

`meili.Index('xxx').getStats(): Promise<object>`

### Updates

- Get One update info:

`meili.Index('xxx').getUpdateStatus(updateId: number): Promise<object>`

- Get all updates info:

`meili.Index('xxx').getAllUpdateStatus(): Promise<object[]>`

### Documents

- Add or update multiples documents:

`meili.Index('xxx').addDocuments(documents: object[]): Promise<Types.AsyncUpdateId>`

- Get Documents:

`meili.Index('xxx').getDocuments(params: Types.getDocumentsParams): Promise<object[]>`

- Get one document:

`meili.Index('xxx').getDocument(documentId: string): Promise<object>`

- Delete one document:

`meili.Index('xxx').deleteDocument(documentId: string): Promise<Types.AsyncUpdateId>`

- Delete multiples documents:

`meili.Index('xxx').deleteDocuments(documentsIds: string[]): Promise<Types.AsyncUpdateId>`

### Settings

- Get settings:

`meili.Index('xxx').getSettings(): Promise<object>`

- Update settings:

`meili.Index('xxx').updateSettings(settings: object): Promise<void>`

### Synonyms

- List all synonyms:

`meili.Index('xxx').listSynonyms(): Promise<object[]>`

- Add a synonyms:

`meili.Index('xxx').createSynonym(input: string, synonyms: string[]): Promise<object>`

#### Stop-words

Waiting on MeiliSearch v0.9.0

### Healthy

- Check if the server is healthy

`meili.isHealthy(): Promise<void>`

- Set the server healthy

`meili.setHealthy(): Promise<void>`

- Set the server unhealthy

`meili.setUnhealthy(): Promise<void>`

- Change the server healthyness

`meili.changeHealthTo(health: boolean): Promise<void>`

### Stats

- Get database stats

`meili.databaseStats(): Promise<object>`

### Version

- Get binary version

`meili.version(): Promise<object>`

### System

- Get system information

`meili.systemInformation(): Promise<object>`

- Get system information (pretty mode)

`meili.systemInformationPretty(): Promise<object>`
