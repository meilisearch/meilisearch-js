# meili-api

> This is the javascript wrapper to the meili API
> Meili provides a instant search engine as a service, you can register on [meilisearch.com](https://www.meilisearch.com/) to get your credentials. You can also try it on your own by installing [MeiliDB](https://github.com/meilisearch/MeiliDB) on your computer.

> 👷🏾‍♂️This is a work in progress, if you need more information on the meili API, you should visit the [API documentation](https://docs.meilisearch.com/)

[![CircleCI](https://circleci.com/gh/meilisearch/js-meili-api.svg?style=svg)](https://circleci.com/gh/meilisearch/js-meili-api)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=meilisearch/js-meili-api)](https://dependabot.com)
[![NPM version](https://img.shields.io/npm/v/@meilisearch/meili-api.svg)](https://www.npmjs.com/package/@meilisearch/meili-api)
![Downloads](https://img.shields.io/npm/dm/@meilisearch/meili-api.svg)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

---

## ✨ Features

- Search documents in meili API
- Index documents in meili API

## 🔧 Installation

```sh
npm install @meilisearch/meili-api
```

```sh
yarn add @meilisearch/meili-api
```

## 🎬 Getting started

Here is a quickstart for a search request

```js
const Meili = require('@meilisearch/meili-api')

// Get your applicationId and apiKey on meilisearch.com
const config = {
  host: 'xxx',
  apiKey: 'xxx',
}

const meili = new Meili(config)

meili
  .Index('indexUid')
  .search({ q: 'batman' })
  .then((response) => {
    console.log(response.hits)
  })
```

## 🎭 Examples

Go checkout [examples](./examples) !

## 📜 API

### Make a search

**Example:**

```js
meili
  .Index('xxx')
  .search({
    q: 'batman',
  })
  .then((response) => {
    console.log(response.hits)
  })
```

### List existing indexes

This methods list all indexes of a database

**Example:**

```js
meili.listIndexes().then((indexes) => {
  console.log(indexes) // ["movies"]
})
```

### Create new index

This methods create a new index

**Example:**

```js
meili.createIndex('movies', {
  id: ['identifier', 'indexed', 'displayed'],
  title: ['displayed', 'indexed'],
  poster: ['indexed', 'displayed'],
})
```

### Get some documents

Browse is a method to get defaults documents without search. This method is usually used to display results when you have no input in the search bar.

**Example:**

```js
meili
  .Index('xxx')
  .browse()
  .then((response) => {
    console.log(response)
  })
```

### `Index(indexUid: string).updateInfo(updateId: number): Promise<object>`

### `Index(indexUid: string).getSchema(): Promise<object>`

### `Index(indexUid: string).Documents().addDocuments(documents: object[]): Promise<object>`

### `Index(indexUid: string).Documents().getDocument(documentId: string): Promise<object>`

### `Index(indexUid: string).Documents().deleteDocument(documentId: string): Promise<object>`

### `Index(indexUid: string).Documents().deleteDocuments(documents: object[]): Promise<object>`

### `Index(indexUid: string).Documents().batchWrite(documentsToInsert: object[], documentsToDelete: object[]): Promise<object>`

### `Index(indexUid: string).Settings().get(): Promise<object>`

### `Index(indexUid: string).Settings().set(settings: object): Promise<void>`

### `Index(indexUid: string).Synonyms().list(): Promise<object[]>`

### `Index(indexUid: string).Synonyms().create(input: string, synonyms: string[]): Promise<object>`

## 🎓 Guides

<details>
<summary>How to do Foo</summary>
Today we're gonna build Foo....
</details>

### 🕵️ Troubleshooting

## 🥂 License

[MIT](./LICENSE.md) as always
