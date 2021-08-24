<p align="center">
  <img src="https://images.meilisearch.workers.dev/v1587402338/SDKs/meilisearch_js.svg" alt="MeiliSearch-JavaScript" width="200" height="200" />
</p>

<h1 align="center">MeiliSearch JavaScript</h1>

<h4 align="center">
  <a href="https://github.com/meilisearch/MeiliSearch">MeiliSearch</a> |
  <a href="https://docs.meilisearch.com">Documentation</a> |
  <a href="https://slack.meilisearch.com">Slack</a> |
  <a href="https://roadmap.meilisearch.com/tabs/1-under-consideration">Roadmap</a> |
  <a href="https://www.meilisearch.com">Website</a> |
  <a href="https://docs.meilisearch.com/faq">FAQ</a>
</h4>

<p align="center">
  <a href="https://www.npmjs.com/package/meilisearch"><img src="https://img.shields.io/npm/v/meilisearch.svg" alt="npm version"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/actions"><img src="https://github.com/meilisearch/meilisearch-js/workflows/Tests/badge.svg" alt="Tests"></a>
  <a href="https://github.com/prettier/prettier"><img src="https://img.shields.io/badge/styled_with-prettier-ff69b4.svg" alt="Prettier"></a>
  <a href="https://github.com/meilisearch/meilisearch-js/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-informational" alt="License"></a>
  <a href="https://app.bors.tech/repositories/28762"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

<p align="center">⚡ The MeiliSearch API client written for JavaScript</p>

**MeiliSearch JavaScript** is the MeiliSearch API client for JavaScript developers.

**MeiliSearch** is an open-source search engine. [Discover what MeiliSearch is!](https://github.com/meilisearch/MeiliSearch)

## Table of Contents <!-- omit in toc -->

- [📖 Documentation](#-documentation)
- [🔧 Installation](#-installation)
- [🎬 Getting Started](#-getting-started)
- [🤖 Compatibility with MeiliSearch](#-compatibility-with-meilisearch)
- [💡 Learn More](#-learn-more)
- [⚙️ Development Workflow and Contributing](#️-development-workflow-and-contributing)
- [📜 API Resources](#-api-resources)

## 📖 Documentation

See our [Documentation](https://docs.meilisearch.com/learn/tutorials/getting_started.html) or our [API References](https://docs.meilisearch.com/reference/api/).

## 🔧 Installation

We only guarantee that the package works with `node` >= 12 and `node` < 15.

With `npm`:

```sh
npm install meilisearch
```

With `yarn`:

```sh
yarn add meilisearch
```

### 🏃‍♀️ Run MeiliSearch <!-- omit in toc -->

There are many easy ways to [download and run a MeiliSearch instance](https://docs.meilisearch.com/reference/features/installation.html#download-and-launch).

For example, if you use Docker:

```bash
docker pull getmeili/meilisearch:latest # Fetch the latest version of MeiliSearch image from Docker Hub
docker run -it --rm -p 7700:7700 getmeili/meilisearch:latest ./meilisearch --master-key=masterKey
```

NB: you can also download MeiliSearch from **Homebrew** or **APT**.

### Import <!-- omit in toc -->

Depending on the environment on which you are using MeiliSearch, imports may differ.

#### Import Syntax <!-- omit in toc -->

Usage in a ES module environment:

```javascript
import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
})
```

#### Include Script Tag <!-- omit in toc -->

Usage in an HTML (or alike) file:

```html
<script src='https://cdn.jsdelivr.net/npm/meilisearch@latest/dist/bundles/meilisearch.umd.js'></script>
<script>
  const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
  })
</script>
```

#### Require Syntax <!-- omit in toc -->

Usage in a back-end node environment

```javascript
const { MeiliSearch } = require('meilisearch')

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
})
```

#### React Native <!-- omit in toc -->

To make this package work with React Native, please add the [react-native-url-polyfill](https://www.npmjs.com/package/react-native-url-polyfill).

#### Deno<!-- omit in toc -->

Usage in a back-end deno environment

```ts
import { MeiliSearch } from "https://esm.sh/meilisearch"

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
})
```


## 🎬 Getting Started

#### Add Documents <!-- omit in toc -->

```js
const { MeiliSearch } = require('meilisearch')
// Or if you are in a ES environment
import { MeiliSearch } from 'meilisearch'

;(async () => {
  const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700',
    apiKey: 'masterKey',
  })

  // An index is where the documents are stored.
  const index = client.index('movies')

  const documents = [
      { id: 1, title: 'Carol', genres: ['Romance', 'Drama'] },
      { id: 2, title: 'Wonder Woman', genres: ['Action', 'Adventure'] },
      { id: 3, title: 'Life of Pi', genres: ['Adventure', 'Drama'] },
      { id: 4, title: 'Mad Max: Fury Road', genres: ['Adventure', 'Science Fiction'] },
      { id: 5, title: 'Moana', genres: ['Fantasy', 'Action']},
      { id: 6, title: 'Philadelphia', genres: ['Drama'] },
  ]

  // If the index 'movies' does not exist, MeiliSearch creates it when you first add the documents.
  let response = await index.addDocuments(documents)

  console.log(response) // => { "updateId": 0 }
})()
```

With the `updateId`, you can check the status (`enqueued`, `processing`, `processed` or `failed`) of your documents addition using the [update endpoint](https://docs.meilisearch.com/reference/api/updates.html#get-an-update-status).

#### Basic Search <!-- omit in toc -->

```javascript
// MeiliSearch is typo-tolerant:
const search = await index.search('philoudelphia')
console.log(search)
```

Output:

```json
{
  "hits": [
    {
      "id": "6",
      "title": "Philadelphia",
      "genres": ["Drama"]
    }
  ],
  "offset": 0,
  "limit": 20,
  "nbHits": 1,
  "processingTimeMs": 1,
  "query": "philoudelphia"
}
```

#### Custom Search <!-- omit in toc -->

All the supported options are described in the [search parameters](https://docs.meilisearch.com/reference/features/search_parameters.html) section of the documentation.

```javascript
await index.search(
  'wonder',
    attributesToHighlight: ['*'],
    filter: 'id >= 1'
  }
)
```

```json
{
  "hits": [
    {
      "id": 2,
      "title": "Wonder Woman",
      "genres": ["Action", "Adventure"],
      "_formatted": {
        "id": 2,
        "title": "<em>Wonder</em> Woman",
        "genres": ["Action", "Adventure"]
      }
    }
  ],
  "offset": 0,
  "limit": 20,
  "nbHits": 1,
  "processingTimeMs": 0,
  "query": "wonder"
}
```

#### Placeholder Search <!-- omit in toc -->

Placeholder search makes it possible to receive hits based on your parameters without having any query (`q`). To enable faceted search on your dataset you need to add `genres` in the [settings](https://docs.meilisearch.com/reference/features/faceted_search.html#setting-up-facets).

```javascript
await index.search(
  '',
  {
    filter: ['genres = fantasy'],
    facetsDistribution: ['genres']
  }
)
```

```json
{
  "hits": [
    {
      "id": 2,
      "title": "Wonder Woman",
      "genres": ["Action","Adventure"]
    },
    {
      "id": 5,
      "title": "Moana",
      "genres": ["Fantasy","Action"]
    }
  ],
  "offset": 0,
  "limit": 20,
  "nbHits": 2,
  "processingTimeMs": 0,
  "query": "",
  "facetsDistribution": {
    "genres": {
      "Action": 2,
      "Fantasy": 1,
      "Adventure": 1
    }
  }
```

#### Abortable Search <!-- omit in toc -->

You can abort a pending search request by providing an [AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) to the request.

```js
const controller = new AbortController()

index
  .search('wonder', {}, {
    signal: controller.signal,
  })
  .then((response) => {
    /** ... */
  })
  .catch((e) => {
    /** Catch AbortError here. */
  })

controller.abort()
```

## 🤖 Compatibility with MeiliSearch

This package only guarantees the compatibility with the [version v0.21.0 of MeiliSearch](https://github.com/meilisearch/MeiliSearch/releases/tag/v0.21.0).

## 💡 Learn More

The following sections may interest you:

- **Manipulate documents**: see the [API references](https://docs.meilisearch.com/reference/api/documents.html) or read more about [documents](https://docs.meilisearch.com/learn/core_concepts/documents.html).
- **Search**: see the [API references](https://docs.meilisearch.com/reference/api/search.html) or follow our guide on [search parameters](https://docs.meilisearch.com/reference/features/search_parameters.html).
- **Manage the indexes**: see the [API references](https://docs.meilisearch.com/reference/api/indexes.html) or read more about [indexes](https://docs.meilisearch.com/learn/core_concepts/indexes.html).
- **Configure the index settings**: see the [API references](https://docs.meilisearch.com/reference/api/settings.html) or follow our guide on [settings parameters](https://docs.meilisearch.com/reference/features/settings.html).

This repository also contains [more examples](./examples).

## ⚙️ Development Workflow and Contributing

Any new contribution is more than welcome in this project!

If you want to know more about the development workflow or want to contribute, please visit our [contributing guidelines](/CONTRIBUTING.md) for detailed instructions!

## 📜 API Resources

### Search <!-- omit in toc -->

- Make a search request:

`client.index<T>('xxx').search(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>`

- Make a search request using GET method (slower than the search method):

`client.index<T>('xxx').searchGet(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>`

### Indexes <!-- omit in toc -->

- List all indexes:

`client.listIndexes(): Promise<IndexResponse[]>`

- Create new index:

`client.createIndex<T>(uid: string, options?: IndexOptions): Promise<Index<T>>`

- Create a local reference to an index:

`client.index<T>(uid: string): Index<T>`

- Get an index:

`client.getIndex<T>(uid: string): Promise<Index<T>>`

- Get or create index if it does not exist

`client.getOrCreateIndex<T>(uid: string, options?: IndexOptions): Promise<Index<T>>`

- Get Index information:

`index.getRawInfo(): Promise<IndexResponse>`

- Update Index:

`client.updateIndex(uid: string, options: IndexOptions): Promise<Index>`
Or using the index object:
`index.update(data: IndexOptions): Promise<Index>`

- Delete Index:

`client.deleteIndex(uid): Promise<void>`
Or using the index object:
`index.delete(): Promise<void>`


- Get specific index stats

`index.getStats(): Promise<IndexStats>`

- Return Index instance with updated information:

`index.fetchInfo(): Promise<Index>`

- Get Primary Key of an Index:

`index.fetchPrimaryKey(): Promise<string | undefined>`

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

`index.updateSynonyms(synonyms: Synonyms): Promise<EnqueuedUpdate>`

- Reset synonyms:

`index.resetSynonyms(): Promise<EnqueuedUpdate>`

### Stop-words <!-- omit in toc -->

- Get Stop Words
  `index.getStopWords(): Promise<string[]>`

- Update Stop Words
  `index.updateStopWords(stopWords: string[] | null ): Promise<EnqueuedUpdate>`

- Reset Stop Words
  `index.resetStopWords(): Promise<EnqueuedUpdate>`

### Ranking rules <!-- omit in toc -->

- Get Ranking Rules
  `index.getRankingRules(): Promise<string[]>`

- Update Ranking Rules
  `index.updateRankingRules(rankingRules: string[] | null): Promise<EnqueuedUpdate>`

- Reset Ranking Rules
  `index.resetRankingRules(): Promise<EnqueuedUpdate>`

### Distinct Attribute <!-- omit in toc -->

- Get Distinct Attribute
  `index.getDistinctAttribute(): Promise<string | void>`

- Update Distinct Attribute
  `index.updateDistinctAttribute(distinctAttribute: string | null): Promise<EnqueuedUpdate>`

- Reset Distinct Attribute
  `index.resetDistinctAttribute(): Promise<EnqueuedUpdate>`

### Searchable Attributes <!-- omit in toc -->

- Get Searchable Attributes
  `index.getSearchableAttributes(): Promise<string[]>`

- Update Searchable Attributes
  `index.updateSearchableAttributes(searchableAttributes: string[] | null): Promise<EnqueuedUpdate>`

- Reset Searchable Attributes
  `index.resetSearchableAttributes(): Promise<EnqueuedUpdate>`

### Displayed Attributes <!-- omit in toc -->

- Get Displayed Attributes
  `index.getDisplayedAttributes(): Promise<string[]>`

- Update Displayed Attributes
  `index.updateDisplayedAttributes(displayedAttributes: string[] | null): Promise<EnqueuedUpdate>`

- Reset Displayed Attributes
  `index.resetDisplayedAttributes(): Promise<EnqueuedUpdate>`

### Filterable Attributes <!-- omit in toc -->

- Get Filterable Attributes
  `index.getFilterableAttributes(): Promise<string[]>`

- Update Filterable Attributes
  `index.updateFilterableAttributes(filterableAttributes: string[] | null): Promise<EnqueuedUpdate>`

- Reset Filterable Attributes
  `index.resetFilterableAttributes(): Promise<EnqueuedUpdate>`

### Keys <!-- omit in toc -->

- Get keys

`client.getKeys(): Promise<Keys>`

### isHealthy <!-- omit in toc -->

- Return `true` or `false` depending on the health of the server.

`client.isHealthy(): Promise<boolean>`

### Health <!-- omit in toc -->

- Check if the server is healthy

`client.health(): Promise<Health>`

### Stats <!-- omit in toc -->

- Get database stats

`client.stats(): Promise<Stats>`

### Version <!-- omit in toc -->

- Get binary version

`client.version(): Promise<Version>`

### Dumps <!-- omit in toc -->

- Trigger a dump creation process

`client.createDump(): Promise<Types.EnqueuedDump>`

- Get the status of a dump creation process

`client.getDumpStatus(dumpUid: string): Promise<Types.EnqueuedDump>`

<hr>

**MeiliSearch** provides and maintains many **SDKs and Integration tools** like this one. We want to provide everyone with an **amazing search experience for any kind of project**. If you want to contribute, make suggestions, or just know what's going on right now, visit us in the [integration-guides](https://github.com/meilisearch/integration-guides) repository.
