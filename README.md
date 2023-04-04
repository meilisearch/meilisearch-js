<p align="center">
  <img src="https://raw.githubusercontent.com/meilisearch/integration-guides/main/assets/logos/meilisearch_js.svg" alt="Meilisearch-JavaScript" width="200" height="200" />
</p>

<h1 align="center">Meilisearch JavaScript</h1>

<h4 align="center">
  <a href="https://github.com/meilisearch/meilisearch">Meilisearch</a> |
  <a href="https://docs.meilisearch.com">Documentation</a> |
  <a href="https://discord.meilisearch.com">Discord</a> |
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

**Meilisearch** is an open-source search engine. [Learn more about Meilisearch.](https://github.com/meilisearch/meilisearch)

## Table of Contents <!-- omit in toc -->

- [📖 Documentation](#-documentation)
- [🔧 Installation](#-installation)
- [🎬 Getting started](#-getting-started)
- [🤖 Compatibility with Meilisearch](#-compatibility-with-meilisearch)
- [💡 Learn more](#-learn-more)
- [⚙️ Contributing](#️-contributing)
- [📜 API resources](#-api-resources)

## 📖 Documentation

This readme contains all the documentation you need to start using this Meilisearch SDK.

For general information on how to use Meilisearch—such as our API reference, tutorials, guides, and in-depth articles—refer to our [main documentation website](https://docs.meilisearch.com/).

## 🔧 Installation

We recommend installing `meilisearch-js` in your project with your package manager of choice.

```sh
npm install meilisearch
```

`meilisearch-js` officially supports `node` versions >= 14 and <= 18.

Instead of using a package manager, you may also import the library directly into your [HTML via a CDN](#include-script-tag).

### Run Meilisearch <!-- omit in toc -->

To use one of our SDKs, you must first have a running Meilisearch instance. Consult our documentation for [instructions on how to download and launch Meilisearch](https://docs.meilisearch.com/reference/features/installation.html#download-and-launch).

### Import <!-- omit in toc -->

After installing `meilisearch-js`, you must import it into your application. There are many ways of doing that depending on your development environment.

#### `import` syntax <!-- omit in toc -->

Usage in an ES module environment:

```javascript
import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
})
```

#### `<script>` tag <!-- omit in toc -->

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

#### `require` syntax <!-- omit in toc -->

Usage in a back-end node.js or another environment supporting CommonJS modules:

```javascript
const { MeiliSearch } = require('meilisearch')

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
})
```

#### React Native <!-- omit in toc -->

To use `meilisearch-js` with React Native, you must also install [react-native-url-polyfill](https://www.npmjs.com/package/react-native-url-polyfill).

#### Deno<!-- omit in toc -->

Usage in a Deno environment:

```js
import { MeiliSearch } from "https://esm.sh/meilisearch"

const client = new MeiliSearch({
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
})
```

## 🎬 Getting started

### Add documents <!-- omit in toc -->

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

Tasks such as document addition always return a unique identifier. You can use this identifier `taskUid` to check the status (`enqueued`, `processing`, `succeeded` or `failed`) of a [task](https://docs.meilisearch.com/reference/api/tasks.html#get-task).

### Basic search <!-- omit in toc -->

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

### Using search parameters <!-- omit in toc -->

`meilisearch-js` supports all [search parameters](https://docs.meilisearch.com/reference/features/search_parameters.html) described in our main documentation website.

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
        "id": "2",
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

### Custom search with filters <!-- omit in toc -->

To enable filtering, you must first add your attributes to the [`filterableAttributes` index setting](https://docs.meilisearch.com/reference/api/filterable_attributes.html).

```js
await index.updateAttributesForFaceting([
    'id',
    'genres'
  ])
```

You only need to perform this operation once per index.

Note that Meilisearch rebuilds your index whenever you update `filterableAttributes`. Depending on the size of your dataset, this might take considerable time. You can track the process using the [tasks API](https://docs.meilisearch.com/reference/api/tasks.html#get-task)).

After you configured `filterableAttributes`, you can use the [`filter` search parameter](https://docs.meilisearch.com/reference/api/search.html#filter) to refine your search:

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

### Placeholder search <!-- omit in toc -->

Placeholder search makes it possible to receive hits based on your parameters without having any query (`q`). For example, in a movies database you can run an empty query to receive all results filtered by `genre`.

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

Note that to enable faceted search on your dataset you need to add `genres` to the `filterableAttributes` index setting. For more information on filtering and faceting, [consult our documentation settings](https://docs.meilisearch.com/reference/features/faceted_search.html#setting-up-facets).

#### Abortable search <!-- omit in toc -->

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


### Using Meilisearch behind a proxy <!-- omit in toc -->

#### Custom request config <!-- omit in toc -->

You can provide a custom request configuration. for example, with custom headers.

```ts
const client: MeiliSearch = new MeiliSearch({
  host: 'http://localhost:3000/api/meilisearch/proxy',
  requestConfig: {
    headers: {
      Authorization: AUTH_TOKEN
    },
    // OR
    credentials: 'include'
  }
})
```

#### Custom http client <!-- omit in toc -->

You can use your own HTTP client, for example, with [`axios`](https://github.com/axios/axios).

```ts
const client: MeiliSearch = new MeiliSearch({
  host: 'http://localhost:3000/api/meilisearch/proxy',
  httpClient: async (url, opts) => {
    const response = await $axios.request({
      url,
      data: opts?.body,
      headers: opts?.headers,
      method: (opts?.method?.toLocaleUpperCase() as Method) ?? 'GET'
    })

    return response.data
  }
})
```

## 🤖 Compatibility with Meilisearch

This package guarantees compatibility with [version v1.x of Meilisearch](https://github.com/meilisearch/meilisearch/releases/latest), but some features may not be present. Please check the [issues](https://github.com/meilisearch/meilisearch-js/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22+label%3Aenhancement) for more info.

## 💡 Learn more

The following sections in our main documentation website may interest you:

- **Manipulate documents**: see the [API references](https://docs.meilisearch.com/reference/api/documents.html) or read more about [documents](https://docs.meilisearch.com/learn/core_concepts/documents.html).
- **Search**: see the [API references](https://docs.meilisearch.com/reference/api/search.html) or follow our guide on [search parameters](https://docs.meilisearch.com/reference/features/search_parameters.html).
- **Manage the indexes**: see the [API references](https://docs.meilisearch.com/reference/api/indexes.html) or read more about [indexes](https://docs.meilisearch.com/learn/core_concepts/indexes.html).
- **Configure the index settings**: see the [API references](https://docs.meilisearch.com/reference/api/settings.html) or follow our guide on [settings parameters](https://docs.meilisearch.com/reference/features/settings.html).

This repository also contains [more examples](./examples).

## ⚙️ Contributing

We welcome all contributions, big and small! If you want to know more about this SDK's development workflow or want to contribute to the repo, please visit our [contributing guidelines](/CONTRIBUTING.md) for detailed instructions.

## 📜 API resources

### Search <!-- omit in toc -->

#### [Make a search request](https://docs.meilisearch.com/reference/api/search.html)

```ts
client.index<T>('xxx').search(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>
```

#### [Make a search request using the GET method (slower than the search method)](https://docs.meilisearch.com/reference/api/search.html#search-in-an-index-with-get-route)

```ts
client.index<T>('xxx').searchGet(query: string, options: SearchParams = {}, config?: Partial<Request>): Promise<SearchResponse<T>>
```

### Multi Search

#### [Make multiple search requests](https://docs.meilisearch.com/reference/api/multi-search.html)

```ts
client.multiSearch(queries?: MultiSearchParams, config?: Partial<Request>): Promise<Promise<MultiSearchResponse<T>>>
```

`multiSearch` uses the `POST` method when performing its request to Meilisearch.

### Documents <!-- omit in toc -->

#### [Add or replace multiple documents](https://docs.meilisearch.com/reference/api/documents.html#add-or-replace-documents)

```ts
client.index('myIndex').addDocuments(documents: Document<T>[]): Promise<EnqueuedTask>
```

#### [Add or replace multiple documents in string format](https://docs.meilisearch.com/reference/api/documents.html#add-or-update-documents)

```ts
client.index('myIndex').addDocumentsFromString(documents: string, contentType: ContentType, queryParams: RawDocumentAdditionOptions): Promise<EnqueuedTask>
```

#### [Add or replace multiple documents in batches](https://docs.meilisearch.com/reference/api/documents.html#add-or-replace-documents)

```ts
client.index('myIndex').addDocumentsInBatches(documents: Document<T>[], batchSize = 1000): Promise<EnqueuedTask[]>
```

#### [Add or update multiple documents](https://docs.meilisearch.com/reference/api/documents.html#add-or-update-documents)

```ts
client.index('myIndex').updateDocuments(documents: Array<Document<Partial<T>>>): Promise<EnqueuedTask>
```

#### [Add or update multiple documents in string format](https://docs.meilisearch.com/reference/api/documents.html#add-or-update-documents)

```ts
client.index('myIndex').updateDocumentsFromString(documents: string, contentType: ContentType, queryParams: RawDocumentAdditionOptions): Promise<EnqueuedTask>
```

#### [Add or update multiple documents in batches](https://docs.meilisearch.com/reference/api/documents.html#add-or-update-documents)

```ts
client.index('myIndex').updateDocumentsInBatches(documents: Array<Document<Partial<T>>>, batchSize = 1000): Promise<EnqueuedTask[]>
```

#### [Get Documents](https://docs.meilisearch.com/reference/api/documents.html#get-documents)

```ts
client.index.getDocuments(parameters: DocumentsQuery = {}): Promise<DocumentsResults<T>>>
```

#### [Get one document](https://docs.meilisearch.com/reference/api/documents.html#get-one-document)

```ts
client.index('myIndex').getDocument(documentId: string): Promise<Document<T>>
```

#### [Delete one document](https://docs.meilisearch.com/reference/api/documents.html#delete-one-document)

```ts
client.index('myIndex').deleteDocument(documentId: string | number): Promise<EnqueuedTask>
```

#### [Delete multiple documents](https://docs.meilisearch.com/reference/api/documents.html#delete-documents)

```ts
client.index('myIndex').deleteDocuments(documentsIds: string[] | number[]): Promise<EnqueuedTask>
```

#### [Delete all documents](https://docs.meilisearch.com/reference/api/documents.html#delete-all-documents)

```ts
client.index('myIndex').deleteAllDocuments(): Promise<Types.EnqueuedTask>
```

### Tasks <!-- omit in toc -->

#### [Get all tasks](https://docs.meilisearch.com/reference/api/tasks.html#get-all-tasks)

```ts
client.getTasks(parameters: TasksQuery): Promise<TasksResults>
```

#### [Get one task](https://docs.meilisearch.com/reference/api/tasks.html#get-task)

```ts
client.getTask(uid: number): Promise<Task>
```

#### [Delete tasks](https://docs.meilisearch.com/reference/api/tasks.html#delete-task)

```ts
client.deleteTasks(parameters: DeleteTasksQuery = {}): Promise<EnqueuedTask>
```

#### [Cancel tasks](https://docs.meilisearch.com/reference/api/tasks.html#cancel-task)

```ts
client.cancelTasks(parameters: CancelTasksQuery = {}): Promise<EnqueuedTask>
```

#### [Get all tasks of an index](https://docs.meilisearch.com/reference/api/tasks.html#get-all-tasks-by-index)

```ts
client.index('myIndex').getTasks(parameters: TasksQuery): Promise<TasksResults>
```

#### [Get one task of an index](https://docs.meilisearch.com/reference/api/tasks.html#get-task)

```ts
client.index('myIndex').getTask(uid: number): Promise<Task>
```


#### Wait for one task


##### Using the client

```ts
client.waitForTask(uid: number, { timeOutMs?: number, intervalMs?: number }): Promise<Task>
```

##### Using the index

```ts
client.index('myIndex').waitForTask(uid: number, { timeOutMs?: number, intervalMs?: number }): Promise<Task>
```

#### Wait for multiple tasks

##### Using the client

```ts
client.waitForTasks(uids: number[], { timeOutMs?: number, intervalMs?: number }): Promise<Task[]>
```

##### Using the index

```ts
client.index('myIndex').waitForTasks(uids: number[], { timeOutMs?: number, intervalMs?: number }): Promise<Task[]>
```

### Indexes <!-- omit in toc -->

#### [Get all indexes in Index instances](https://docs.meilisearch.com/reference/api/indexes.html#list-all-indexes)

```ts
client.getIndexes(parameters: IndexesQuery): Promise<IndexesResults<Index[]>>
```

#### [Get all indexes](https://docs.meilisearch.com/reference/api/indexes.html#list-all-indexes)

```ts
client.getRawIndexes(parameters: IndexesQuery): Promise<IndexesResults<IndexObject[]>>
```


#### [Create a new index](https://docs.meilisearch.com/reference/api/indexes.html#create-an-index)

```ts
client.createIndex<T>(uid: string, options?: IndexOptions): Promise<EnqueuedTask>
```

#### Create a local reference to an index

```ts
client.index<T>(uid: string): Index<T>
```

#### [Get an index instance completed with information fetched from Meilisearch](https://docs.meilisearch.com/reference/api/indexes.html#get-one-index)

```ts
client.getIndex<T>(uid: string): Promise<Index<T>>
```

#### [Get the raw index JSON response from Meilisearch](https://docs.meilisearch.com/reference/api/indexes.html#get-one-index)

```ts
client.getRawIndex(uid: string): Promise<IndexObject>
```

#### [Get an object with information about the index](https://docs.meilisearch.com/reference/api/indexes.html#get-one-index)

```ts
client.index('myIndex').getRawInfo(): Promise<IndexObject>
```

#### [Update Index](https://docs.meilisearch.com/reference/api/indexes.html#update-an-index)

##### Using the client

```ts
client.updateIndex(uid: string, options: IndexOptions): Promise<EnqueuedTask>
```

##### Using the index object

```ts
client.index('myIndex').update(data: IndexOptions): Promise<EnqueuedTask>
```

#### [Delete index](https://docs.meilisearch.com/reference/api/indexes.html#delete-an-index)

##### Using the client
```ts
client.deleteIndex(uid): Promise<void>
```

##### Using the index object
```ts
client.index('myIndex').delete(): Promise<void>
```

#### [Get specific index stats](https://docs.meilisearch.com/reference/api/stats.html#get-stat-of-an-index)

```ts
client.index('myIndex').getStats(): Promise<IndexStats>
```

##### Return Index instance with updated information

```ts
client.index('myIndex').fetchInfo(): Promise<Index>
```

##### Get Primary Key of an Index

```ts
client.index('myIndex').fetchPrimaryKey(): Promise<string | undefined>
```

##### Swap two indexes

```ts
client.swapIndexes(params: SwapIndexesParams): Promise<EnqueuedTask>
```

### Settings <!-- omit in toc -->

#### [Get settings](https://docs.meilisearch.com/reference/api/settings.html#get-settings)

```ts
client.index('myIndex').getSettings(): Promise<Settings>
```

#### [Update settings](https://docs.meilisearch.com/reference/api/settings.html#update-settings)

```ts
client.index('myIndex').updateSettings(settings: Settings): Promise<EnqueuedTask>
```

#### [Reset settings](https://docs.meilisearch.com/reference/api/settings.html#reset-settings)

```ts
client.index('myIndex').resetSettings(): Promise<EnqueuedTask>
```

### Pagination Settings

#### [Get pagination](https://docs.meilisearch.com/reference/api/settings.html#get-pagination-settings)

```ts
client.index('myIndex').getPagination(): Promise<PaginationSettings>
```

#### [Update pagination](https://docs.meilisearch.com/reference/api/settings.html#update-pagination-settings)

```ts
client.index('myIndex').updatePagination(pagination: PaginationSettings): Promise<EnqueuedTask>
```

#### [Reset pagination](https://docs.meilisearch.com/reference/api/settings.html#reset-pagination-settings)

```ts
client.index('myIndex').resetPagination(): Promise<EnqueuedTask>
```

### Synonyms <!-- omit in toc -->

#### [Get synonyms](https://docs.meilisearch.com/reference/api/synonyms.html#get-synonyms)

```ts
client.index('myIndex').getSynonyms(): Promise<Synonyms>
```

#### [Update synonyms](https://docs.meilisearch.com/reference/api/synonyms.html#update-synonyms)

```ts
client.index('myIndex').updateSynonyms(synonyms: Synonyms): Promise<EnqueuedTask>
```

#### [Reset synonyms](https://docs.meilisearch.com/reference/api/synonyms.html#reset-synonyms)

```ts
client.index('myIndex').resetSynonyms(): Promise<EnqueuedTask>
```

### Stop words <!-- omit in toc -->

#### [Get stop words](https://docs.meilisearch.com/reference/api/stop_words.html#get-stop-words)

```ts
client.index('myIndex').getStopWords(): Promise<string[]>
```

#### [Update stop words](https://docs.meilisearch.com/reference/api/stop_words.html#update-stop-words)

```ts
client.index('myIndex').updateStopWords(stopWords: string[] | null ): Promise<EnqueuedTask>
```

#### [Reset stop words](https://docs.meilisearch.com/reference/api/stop_words.html#reset-stop-words)

```ts
client.index('myIndex').resetStopWords(): Promise<EnqueuedTask>
```

### Ranking rules <!-- omit in toc -->

#### [Get ranking rules](https://docs.meilisearch.com/reference/api/ranking_rules.html#get-ranking-rules)

```ts
client.index('myIndex').getRankingRules(): Promise<string[]>
```

#### [Update ranking rules](https://docs.meilisearch.com/reference/api/ranking_rules.html#update-ranking-rules)

```ts
client.index('myIndex').updateRankingRules(rankingRules: string[] | null): Promise<EnqueuedTask>
```

#### [Reset ranking rules](https://docs.meilisearch.com/reference/api/ranking_rules.html#reset-ranking-rules)

```ts
client.index('myIndex').resetRankingRules(): Promise<EnqueuedTask>
```

### Distinct Attribute <!-- omit in toc -->

#### [Get distinct attribute](https://docs.meilisearch.com/reference/api/distinct_attribute.html#get-distinct-attribute)

```ts
client.index('myIndex').getDistinctAttribute(): Promise<string | void>
```

#### [Update distinct attribute](https://docs.meilisearch.com/reference/api/distinct_attribute.html#update-distinct-attribute)

```ts
client.index('myIndex').updateDistinctAttribute(distinctAttribute: string | null): Promise<EnqueuedTask>
```

#### [Reset distinct attribute](https://docs.meilisearch.com/reference/api/distinct_attribute.html#reset-distinct-attribute)

```ts
client.index('myIndex').resetDistinctAttribute(): Promise<EnqueuedTask>
```

### Searchable attributes <!-- omit in toc -->

#### [Get searchable attributes](https://docs.meilisearch.com/reference/api/searchable_attributes.html#get-searchable-attributes)

```ts
client.index('myIndex').getSearchableAttributes(): Promise<string[]>
```

#### [Update searchable attributes](https://docs.meilisearch.com/reference/api/searchable_attributes.html#update-searchable-attributes)

```ts
client.index('myIndex').updateSearchableAttributes(searchableAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset searchable attributes](https://docs.meilisearch.com/reference/api/searchable_attributes.html#reset-searchable-attributes)

```ts
client.index('myIndex').resetSearchableAttributes(): Promise<EnqueuedTask>
```

### Displayed attributes <!-- omit in toc -->

#### [Get displayed attributes](https://docs.meilisearch.com/reference/api/displayed_attributes.html#get-displayed-attributes)

```ts
client.index('myIndex').getDisplayedAttributes(): Promise<string[]>
```

#### [Update displayed attributes](https://docs.meilisearch.com/reference/api/displayed_attributes.html#update-displayed-attributes)

```ts
client.index('myIndex').updateDisplayedAttributes(displayedAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset displayed attributes](https://docs.meilisearch.com/reference/api/displayed_attributes.html#reset-displayed-attributes)

```ts
client.index('myIndex').resetDisplayedAttributes(): Promise<EnqueuedTask>
```

### Filterable attributes <!-- omit in toc -->

#### [Get filterable attributes](https://docs.meilisearch.com/reference/api/filterable_attributes.html#get-filterable-attributes)

```ts
client.index('myIndex').getFilterableAttributes(): Promise<string[]>
```

#### [Update filterable attributes](https://docs.meilisearch.com/reference/api/filterable_attributes.html#update-filterable-attributes)

```ts
client.index('myIndex').updateFilterableAttributes(filterableAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset filterable attributes](https://docs.meilisearch.com/reference/api/filterable_attributes.html#reset-filterable-attributes)

```ts
client.index('myIndex').resetFilterableAttributes(): Promise<EnqueuedTask>
```

### Sortable attributes <!-- omit in toc -->

#### [Get sortable attributes](https://docs.meilisearch.com/reference/api/sortable_attributes.html#get-sortable-attributes)

```ts
client.index('myIndex').getSortableAttributes(): Promise<string[]>
```

#### [Update sortable attributes](https://docs.meilisearch.com/reference/api/sortable_attributes.html#update-sortable-attributes)

```ts
client.index('myIndex').updateSortableAttributes(sortableAttributes: string[] | null): Promise<EnqueuedTask>
```

#### [Reset sortable attributes](https://docs.meilisearch.com/reference/api/sortable_attributes.html#reset-sortable-attributes)

```ts
client.index('myIndex').resetSortableAttributes(): Promise<EnqueuedTask>
```

### Faceting <!-- omit in toc -->

#### [Get faceting](https://docs.meilisearch.com/reference/api/settings.html#get-faceting-settings)

```ts
client.index('myIndex').getFaceting(): Promise<Faceting>
```

#### [Update faceting](https://docs.meilisearch.com/reference/api/settings.html#update-faceting-settings)

```ts
client.index('myIndex').updateFaceting(faceting: Faceting): Promise<EnqueuedTask>
```

#### [Reset faceting](https://docs.meilisearch.com/reference/api/settings.html#reset-faceting-settings)

```ts
client.index('myIndex').resetFaceting(): Promise<EnqueuedTask>
```

### Typo tolerance <!-- omit in toc -->

#### [Get typo tolerance](https://docs.meilisearch.com/reference/api/typo_tolerance.html#get-typo-tolerance)

```ts
client.index('myIndex').getTypoTolerance(): Promise<TypoTolerance>
```

#### [Update typo tolerance](https://docs.meilisearch.com/reference/api/typo_tolerance.html#update-typo-tolerance)

```ts
client.index('myIndex').updateTypoTolerance(typoTolerance: TypoTolerance | null): Promise<EnqueuedTask>
```

#### [Reset typo tolerance](https://docs.meilisearch.com/reference/api/typo_tolerance.html#reset-typo-tolerance)

```ts
client.index('myIndex').resetTypoTolerance(): Promise<EnqueuedTask>
```

### Keys <!-- omit in toc -->

#### [Get keys](https://docs.meilisearch.com/reference/api/keys.html#get-all-keys)

```ts
client.getKeys(parameters: KeysQuery): Promise<KeysResults>
```

#### [Get one key](https://docs.meilisearch.com/reference/api/keys.html#get-one-key)

```ts
client.getKey(keyOrUid: string): Promise<Key>
```

#### [Create a key](https://docs.meilisearch.com/reference/api/keys.html#create-a-key)

```ts
client.createKey(options: KeyCreation): Promise<Key>
```

#### [Update a key](https://docs.meilisearch.com/reference/api/keys.html#update-a-key)

```ts
client.updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key>
```

#### [Delete a key](https://docs.meilisearch.com/reference/api/keys.html#delete-a-key)

```ts
client.deleteKey(keyOrUid: string): Promise<void>
```

### `isHealthy` <!-- omit in toc -->

#### [Return `true` or `false` depending on the health of the server](https://docs.meilisearch.com/reference/api/health.html#get-health)

```ts
client.isHealthy(): Promise<boolean>
```

### Health <!-- omit in toc -->

#### [Check if the server is healthy](https://docs.meilisearch.com/reference/api/health.html#get-health)

```ts
client.health(): Promise<Health>
```

### Stats <!-- omit in toc -->

#### [Get database stats](https://docs.meilisearch.com/reference/api/stats.html#get-stats-of-all-indexes)

```ts
client.getStats(): Promise<Stats>
```

### Version <!-- omit in toc -->

#### [Get binary version](https://docs.meilisearch.com/reference/api/version.html#get-version-of-meilisearch)

```ts
client.getVersion(): Promise<Version>
```

### Dumps <!-- omit in toc -->

#### [Trigger a dump creation process](https://docs.meilisearch.com/reference/api/dump.html#create-a-dump)

```ts
client.createDump(): Promise<EnqueuedTask>
```

---

Meilisearch provides and maintains many SDKs and integration tools like this one. We want to provide everyone with an **amazing search experience for any kind of project**. For a full overview of everything we create and maintain, take a look at the [integration-guides](https://github.com/meilisearch/integration-guides) repository.
