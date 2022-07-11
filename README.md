<p align="center">
  <img src="https://raw.githubusercontent.com/meilisearch/integration-guides/main/assets/logos/meilisearch_js.svg" alt="Meilisearch-JavaScript" width="200" height="200" />
</p>

<h1 align="center">Meilisearch JavaScript</h1>

<h4 align="center">
  <a href="https://github.com/meilisearch/meilisearch">Meilisearch</a> |
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
  <a href="https://ms-bors.herokuapp.com/repositories/10"><img src="https://bors.tech/images/badge_small.svg" alt="Bors enabled"></a>
</p>

<p align="center">⚡ The Meilisearch API client written for JavaScript</p>

**Meilisearch JavaScript** is the Meilisearch API client for JavaScript developers.

**Meilisearch** is an open-source search engine. [Discover what Meilisearch is!](https://github.com/meilisearch/meilisearch)

## Table of Contents <!-- omit in toc -->

- [📖 Documentation](#-documentation)
- [🔧 Installation](#-installation)
- [🎬 Getting Started](#-getting-started)
- [🤖 Compatibility with Meilisearch](#-compatibility-with-meilisearch)
- [💡 Learn More](#-learn-more)
- [⚙️ Development Workflow and Contributing](#️-development-workflow-and-contributing)
- [📜 API Resources](#-api-resources)

## 📖 Documentation

See our [Documentation](https://docs.meilisearch.com/learn/tutorials/getting_started.html) or our [API References](https://docs.meilisearch.com/reference/api/).

## 🔧 Installation

We only guarantee that the package works with `node` >= 12 and `node` <= 16.

With `npm`:

```sh
npm install meilisearch
```

With `yarn`:

```sh
yarn add meilisearch
```

### 🏃‍♀️ Run Meilisearch <!-- omit in toc -->

There are many easy ways to [download and run a Meilisearch instance](https://docs.meilisearch.com/reference/features/installation.html#download-and-launch).

For example, using the `curl` command in [your Terminal](https://itconnect.uw.edu/learn/workshops/online-tutorials/web-publishing/what-is-a-terminal/):

```bash
# Install Meilisearch
curl -L https://install.meilisearch.com | sh

# Launch Meilisearch
./meilisearch --master-key=masterKey
```

NB: you can also download Meilisearch from **Homebrew** or **APT** or even run it using **Docker**.

### Import <!-- omit in toc -->

Depending on the environment in which you are using Meilisearch, imports may differ.

#### Import Syntax <!-- omit in toc -->

Usage in an ES module environment:

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

  // If the index 'movies' does not exist, Meilisearch creates it when you first add the documents.
  let response = await index.addDocuments(documents)

  console.log(response) // => { "uid": 0 }
})()
```

With the `uid`, you can check the status (`enqueued`, `processing`, `succeeded` or `failed`) of your documents addition using the [task](https://docs.meilisearch.com/reference/api/tasks.html#get-task).

#### Basic Search <!-- omit in toc -->

```javascript
// Meilisearch is typo-tolerant:
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
  "estimatedTotalHits": 1,
  "processingTimeMs": 1,
  "query": "philoudelphia"
}
```

#### Custom Search <!-- omit in toc -->

All the supported options are described in the [search parameters](https://docs.meilisearch.com/reference/features/search_parameters.html) section of the documentation.

```javascript
await index.search(
  'wonder',
  {
    attributesToHighlight: ['*']
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
  "estimatedTotalHits": 1,
  "processingTimeMs": 0,
  "query": "wonder"
}
```

#### Custom Search With Filters <!-- omit in toc -->

If you want to enable filtering, you must add your attributes to the `filterableAttributes` index setting.

```js
await index.updateAttributesForFaceting([
    'id',
    'genres'
  ])
```

You only need to perform this operation once.

Note that Meilisearch will rebuild your index whenever you update `filterableAttributes`. Depending on the size of your dataset, this might take time. You can track the process using the [tasks](https://docs.meilisearch.com/reference/api/tasks.html#get-task)).

Then, you can perform the search:

```js
await index.search(
  'wonder',
  {
    filter: ['id > 1 AND genres = Action']
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
    }
  ],
  "offset": 0,
  "limit": 20,
  "estimatedTotalHits": 1,
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
    facets: ['genres']
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
  "estimatedTotalHits": 2,
  "processingTimeMs": 0,
  "query": "",
  "facetDistribution": {
    "genres": {
      "Action": 2,
      "Fantasy": 1,
      "Adventure": 1
    }
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

## 🤖 Compatibility with Meilisearch

This package only guarantees the compatibility with the [version v0.28.0 of Meilisearch](https://github.com/meilisearch/meilisearch/releases/tag/v0.28.0).

## 💡 Learn More

The following sections may interest you:

- **Manipulate documents**: see the [API references](https://docs.meilisearch.com/reference/api/documents.html) or read more about [documents](https://docs.meilisearch.com/learn/core_concepts/documents.html).
- **Search**: see the [API references](https://docs.meilisearch.com/reference/api/search.html) or follow our guide on [search parameters](https://docs.meilisearch.com/reference/features/search_parameters.html).
- **Manage the indexes**: see the [API references](https://docs.meilisearch.com/reference/api/indexes.html) or read more about [indexes](https://docs.meilisearch.com/learn/core_concepts/indexes.html).
- **Configure the index settings**: see the [API references](https://docs.meilisearch.com/reference/api/settings.html) or follow our guide on [settings parameters](https://docs.meilisearch.com/reference/features/settings.html).

This repository also contains [more examples](./examples).

## ⚙️ Development Workflow and Contributing

Any new contribution is more than welcome to this project!

If you want to know more about the development workflow or want to contribute, please visit our [contributing guidelines](/CONTRIBUTING.md) for detailed instructions!

## 📜 API Resources

### Search <!-- omit in toc -->

- [Make a search request](https://docs.meilisearch.com/reference/api/search.html):

`client.index<T>('xxx').search(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>`

- [Make a search request using the GET method (slower than the search method)](https://docs.meilisearch.com/reference/api/search.html#search-in-an-index-with-get-route):

`client.index<T>('xxx').searchGet(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>`

### Documents <!-- omit in toc -->

- [Add or replace multiple documents](https://docs.meilisearch.com/reference/api/documents.html#add-or-replace-documents):

`index.addDocuments(documents: Document<T>[]): Promise<EnqueuedTask>`

- [Add or replace multiple documents in batches](https://docs.meilisearch.com/reference/api/documents.html#add-or-replace-documents):

`index.addDocumentsInBatches(documents: Document<T>[], batchSize = 1000): Promise<EnqueuedTask[]>`

- [Add or update multiple documents](https://docs.meilisearch.com/reference/api/documents.html#add-or-update-documents):

`index.updateDocuments(documents: Array<Document<Partial<T>>>): Promise<EnqueuedTask>`

- [Add or update multiple documents in batches](https://docs.meilisearch.com/reference/api/documents.html#add-or-update-documents):

`index.updateDocumentsInBatches(documents: Array<Document<Partial<T>>>, batchSize = 1000): Promise<EnqueuedTask[]>`

- [Get Documents](https://docs.meilisearch.com/reference/api/documents.html#get-documents):

`index.getDocuments(parameters: DocumentsQuery = {}): Promise<DocumentsResults<T>>>`

- [Get one document](https://docs.meilisearch.com/reference/api/documents.html#get-one-document):

`index.getDocument(documentId: string): Promise<Document<T>>`

- [Delete one document](https://docs.meilisearch.com/reference/api/documents.html#delete-one-document):

`index.deleteDocument(documentId: string | number): Promise<EnqueuedTask>`

- [Delete multiple documents](https://docs.meilisearch.com/reference/api/documents.html#delete-documents):

`index.deleteDocuments(documentsIds: string[] | number[]): Promise<EnqueuedTask>`

- [Delete all documents](https://docs.meilisearch.com/reference/api/documents.html#delete-all-documents):

`index.deleteAllDocuments(): Promise<Types.EnqueuedTask>`

### Tasks <!-- omit in toc -->

- [Get all tasks](https://docs.meilisearch.com/reference/api/tasks.html#get-all-tasks)

  `client.getTasks(parameters: TasksQuery): Promise<TasksResults>`

- [Get one task](https://docs.meilisearch.com/reference/api/tasks.html#get-task)

  `client.getTask(uid: number): Promise<Task>`

- [Get all tasks of an index](https://docs.meilisearch.com/reference/api/tasks.html#get-all-tasks-by-index)

  `index.getTasks(parameters: TasksQuery): Promise<TasksResults>`

- [Get one task of an index](https://docs.meilisearch.com/reference/api/tasks.html#get-task)

  `index.getTask(uid: number): Promise<Task>`

- Wait for one task:

  `client.waitForTask(uid: number, { timeOutMs?: number, intervalMs?: number }): Promise<Task>`

  With an index instance:
  `index.waitForTask(uid: number, { timeOutMs?: number, intervalMs?: number }): Promise<Task>`

- Wait for multiple tasks:
  `client.waitForTasks(uids: number[], { timeOutMs?: number, intervalMs?: number }): Promise<Task[]>`

  With an index instance:
  `index.waitForTasks(uids: number[], { timeOutMs?: number, intervalMs?: number }): Promise<Task[]>`

### Indexes <!-- omit in toc -->

- [Get all indexes as Index instances](https://docs.meilisearch.com/reference/api/indexes.html#list-all-indexes):

`client.getIndexes(parameters: IndexesQuery): Promise<IndexesResults<Index[]>>`

- [Get all indexes](https://docs.meilisearch.com/reference/api/indexes.html#list-all-indexes):

`client.getRawIndexes(parameters: IndexesQuery): Promise<IndexesResults<IndexObject[]>>`

- [Create a new index](https://docs.meilisearch.com/reference/api/indexes.html#create-an-index):

`client.createIndex<T>(uid: string, options?: IndexOptions): Promise<EnqueuedTask>`

- Create a local reference to an index:

`client.index<T>(uid: string): Index<T>`

- [Get an index instance completed with information fetched from Meilisearch](https://docs.meilisearch.com/reference/api/indexes.html#get-one-index):
`client.getIndex<T>(uid: string): Promise<Index<T>>`

- [Get the raw index JSON response from Meilisearch](https://docs.meilisearch.com/reference/api/indexes.html#get-one-index):
`client.getRawIndex(uid: string): Promise<IndexObject>`

- [Get an object with information about the index](https://docs.meilisearch.com/reference/api/indexes.html#get-one-index):
`index.getRawInfo(): Promise<IndexObject>`

- [Update Index](https://docs.meilisearch.com/reference/api/indexes.html#update-an-index):

Using the client
`client.updateIndex(uid: string, options: IndexOptions): Promise<EnqueuedTask>`

Using the index object:
`index.update(data: IndexOptions): Promise<EnqueuedTask>`

- [Delete Index](https://docs.meilisearch.com/reference/api/indexes.html#delete-an-index):

Using the client
`client.deleteIndex(uid): Promise<void>`

Using the index object:
`index.delete(): Promise<void>`

- [Get specific index stats](https://docs.meilisearch.com/reference/api/stats.html#get-stat-of-an-index):

`index.getStats(): Promise<IndexStats>`

- Return Index instance with updated information:

`index.fetchInfo(): Promise<Index>`

- Get Primary Key of an Index:

`index.fetchPrimaryKey(): Promise<string | undefined>`

### Settings <!-- omit in toc -->

- [Get settings](https://docs.meilisearch.com/reference/api/settings.html#get-settings):

`index.getSettings(): Promise<Settings>`

- [Update settings](https://docs.meilisearch.com/reference/api/settings.html#update-settings):

`index.updateSettings(settings: Settings): Promise<EnqueuedTask>`

- [Reset settings](https://docs.meilisearch.com/reference/api/settings.html#reset-settings):

`index.resetSettings(): Promise<EnqueuedTask>`

### Synonyms <!-- omit in toc -->

- [Get synonyms](https://docs.meilisearch.com/reference/api/synonyms.html#get-synonyms):

`index.getSynonyms(): Promise<object>`

- [Update synonyms](https://docs.meilisearch.com/reference/api/synonyms.html#update-synonyms):

`index.updateSynonyms(synonyms: Synonyms): Promise<EnqueuedTask>`

- [Reset synonyms](https://docs.meilisearch.com/reference/api/synonyms.html#reset-synonyms):

`index.resetSynonyms(): Promise<EnqueuedTask>`

### Stop-words <!-- omit in toc -->

- [Get Stop Words](https://docs.meilisearch.com/reference/api/stop_words.html#get-stop-words):
  `index.getStopWords(): Promise<string[]>`

- [Update Stop Words](https://docs.meilisearch.com/reference/api/stop_words.html#update-stop-words):
  `index.updateStopWords(stopWords: string[] | null ): Promise<EnqueuedTask>`

- [Reset Stop Words](https://docs.meilisearch.com/reference/api/stop_words.html#reset-stop-words):
  `index.resetStopWords(): Promise<EnqueuedTask>`

### Ranking rules <!-- omit in toc -->

- [Get Ranking Rules](https://docs.meilisearch.com/reference/api/ranking_rules.html#get-ranking-rules):
  `index.getRankingRules(): Promise<string[]>`

- [Update Ranking Rules](https://docs.meilisearch.com/reference/api/ranking_rules.html#update-ranking-rules):
  `index.updateRankingRules(rankingRules: string[] | null): Promise<EnqueuedTask>`

- [Reset Ranking Rules](https://docs.meilisearch.com/reference/api/ranking_rules.html#reset-ranking-rules):
  `index.resetRankingRules(): Promise<EnqueuedTask>`

### Distinct Attribute <!-- omit in toc -->

- [Get Distinct Attribute](https://docs.meilisearch.com/reference/api/distinct_attribute.html#get-distinct-attribute):
  `index.getDistinctAttribute(): Promise<string | void>`

- [Update Distinct Attribute](https://docs.meilisearch.com/reference/api/distinct_attribute.html#update-distinct-attribute):
  `index.updateDistinctAttribute(distinctAttribute: string | null): Promise<EnqueuedTask>`

- [Reset Distinct Attribute](https://docs.meilisearch.com/reference/api/distinct_attribute.html#reset-distinct-attribute):
  `index.resetDistinctAttribute(): Promise<EnqueuedTask>`

### Searchable Attributes <!-- omit in toc -->

- [Get Searchable Attributes](https://docs.meilisearch.com/reference/api/searchable_attributes.html#get-searchable-attributes):
  `index.getSearchableAttributes(): Promise<string[]>`

- [Update Searchable Attributes](https://docs.meilisearch.com/reference/api/searchable_attributes.html#update-searchable-attributes):
  `index.updateSearchableAttributes(searchableAttributes: string[] | null): Promise<EnqueuedTask>`

- [Reset Searchable Attributes](https://docs.meilisearch.com/reference/api/searchable_attributes.html#reset-searchable-attributes):
  `index.resetSearchableAttributes(): Promise<EnqueuedTask>`

### Displayed Attributes <!-- omit in toc -->

- [Get Displayed Attributes](https://docs.meilisearch.com/reference/api/displayed_attributes.html#get-displayed-attributes):
  `index.getDisplayedAttributes(): Promise<string[]>`

- [Update Displayed Attributes](https://docs.meilisearch.com/reference/api/displayed_attributes.html#update-displayed-attributes):
  `index.updateDisplayedAttributes(displayedAttributes: string[] | null): Promise<EnqueuedTask>`

- [Reset Displayed Attributes](https://docs.meilisearch.com/reference/api/displayed_attributes.html#reset-displayed-attributes):
  `index.resetDisplayedAttributes(): Promise<EnqueuedTask>`

### Filterable Attributes <!-- omit in toc -->

- [Get Filterable Attributes](https://docs.meilisearch.com/reference/api/filterable_attributes.html#get-filterable-attributes):
  `index.getFilterableAttributes(): Promise<string[]>`

- [Update Filterable Attributes](https://docs.meilisearch.com/reference/api/filterable_attributes.html#update-filterable-attributes):
  `index.updateFilterableAttributes(filterableAttributes: string[] | null): Promise<EnqueuedTask>`

- [Reset Filterable Attributes](https://docs.meilisearch.com/reference/api/filterable_attributes.html#reset-filterable-attributes):
  `index.resetFilterableAttributes(): Promise<EnqueuedTask>`

### Sortable Attributes <!-- omit in toc -->

- [Get Sortable Attributes](https://docs.meilisearch.com/reference/api/sortable_attributes.html#get-sortable-attributes):
  `index.getSortableAttributes(): Promise<string[]>`

- [Update Sortable Attributes](https://docs.meilisearch.com/reference/api/sortable_attributes.html#update-sortable-attributes):
  `index.updateSortableAttributes(sortableAttributes: string[] | null): Promise<EnqueuedTask>`

- [Reset Sortable Attributes](https://docs.meilisearch.com/reference/api/sortable_attributes.html#reset-sortable-attributes):
  `index.resetSortableAttributes(): Promise<EnqueuedTask>`

### Typo Tolerance <!-- omit in toc -->

- [Get Typo Tolerance](https://docs.meilisearch.com/reference/api/typo_tolerance.html#get-typo-tolerance):
  `index.getTypoTolerance(): Promise<TypoTolerance>`

- [Update Typo Tolerance](https://docs.meilisearch.com/reference/api/typo_tolerance.html#update-typo-tolerance):
  `index.updateTypoTolerance(typoTolerance: TypoTolerance | null): Promise<EnqueuedTask>`

- [Reset Typo Tolerance](https://docs.meilisearch.com/reference/api/typo_tolerance.html#reset-typo-tolerance):
  `index.resetTypoTolerance(): Promise<EnqueuedTask>`

### Keys <!-- omit in toc -->

- [Get keys](https://docs.meilisearch.com/reference/api/keys.html#get-all-keys):

`client.getKeys(parameters: KeysQuery): Promise<KeysResults>`

- [Get one key](https://docs.meilisearch.com/reference/api/keys.html#get-one-key):

`client.getKey(keyOrUid: string): Promise<Key>`

- [Create a key](https://docs.meilisearch.com/reference/api/keys.html#create-a-key):

`client.createKey(options: KeyCreation): Promise<Key>`

- [Update a key](https://docs.meilisearch.com/reference/api/keys.html#update-a-key):

`client.updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key>`

- [Delete a key](https://docs.meilisearch.com/reference/api/keys.html#delete-a-key):

`client.deleteKey(keyOrUid: string): Promise<void>`

### isHealthy <!-- omit in toc -->

- [Return `true` or `false` depending on the health of the server](https://docs.meilisearch.com/reference/api/health.html#get-health):

`client.isHealthy(): Promise<boolean>`

### Health <!-- omit in toc -->

- [Check if the server is healthy](https://docs.meilisearch.com/reference/api/health.html#get-health):

`client.health(): Promise<Health>`

### Stats <!-- omit in toc -->

- [Get database stats](https://docs.meilisearch.com/reference/api/stats.html#get-stats-of-all-indexes):

`client.getStats(): Promise<Stats>`

### Version <!-- omit in toc -->

- [Get binary version](https://docs.meilisearch.com/reference/api/version.html#get-version-of-meilisearch):

`client.getVersion(): Promise<Version>`

### Dumps <!-- omit in toc -->

- [Trigger a dump creation process](https://docs.meilisearch.com/reference/api/dump.html#create-a-dump):

`client.createDump(): Promise<EnqueuedTask>`

<hr>

**Meilisearch** provides and maintains many **SDKs and Integration tools** like this one. We want to provide everyone with an **amazing search experience for any kind of project**. If you want to contribute, make suggestions, or just know what's going on right now, visit us in the [integration-guides](https://github.com/meilisearch/integration-guides) repository.
