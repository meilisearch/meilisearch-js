# meili-api

> A js library to wrap the meili api

[![Build Status](https://travis-ci.org/qdequele/meili-api.svg?branch=master)](https://travis-ci.org/qdequele/meili-api)
[![NPM version](https://img.shields.io/npm/v/@meilisearch/meili-api.svg)](https://www.npmjs.com/package/@meilisearch/meili-api)
![Downloads](https://img.shields.io/npm/dm/@meilisearch/meili-api.svg)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

---

## ✨ Features

- feature one
- feature two

## 🔧 Installation

```sh
npm install @meilisearch/meili-api
```

```sh
yarn add @meilisearch/meili-api
```

## 🎬 Getting started

Let's demonstrate simple usage with ... example:

```js
var Meili = require('@meilisearch/meili-api')

var config = {
  applicationId: 'xxx',
  apiKey: 'xxx',
}
var meili = new Meili(config)
```

## 🎭 Examples

Go checkout [examples](./examples) !

## 📜 API

### `listIndexes(): Promise<string[]>`

This methods list all indexes of a database

**Example:**

```js
meili.listIndexes().then((indexes) => {
  console.log(indexes) // ["movies"]
})
```

### `createIndex(indexId: string, schema: Schema): Promise<void>`

This methods create a new index

**Example:**

```js
meili.createIndex('movies', {
  id: ['identifier', 'indexed', 'displayed'],
  title: ['displayed', 'indexed'],
  poster: ['indexed', 'displayed'],
})
```

### `Index(indexId: string).search(queryParams: object): Promise<object>`

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

### `Index(indexId: string).browse(queryParams: object): Promise<object[]>`

**Example:**

```js
meili
  .Index('xxx')
  .browse()
  .then((response) => {
    console.log(response)
  })
```

### `Index(indexId: string).updateInfo(updateId: number): Promise<object>`

### `Index(indexId: string).getSchema(): Promise<object>`

### `Index(indexId: string).Documents().addDocuments(documents: object[]): Promise<object>`

### `Index(indexId: string).Documents().getDocument(documentId: string): Promise<object>`

### `Index(indexId: string).Documents().deleteDocument(documentId: string): Promise<object>`

### `Index(indexId: string).Documents().deleteDocuments(documents: object[]): Promise<object>`

### `Index(indexId: string).Documents().batchWrite(documentsToInsert: object[], documentsToDelete: object[]): Promise<object>`

### `Index(indexId: string).Settings().get(): Promise<object>`

### `Index(indexId: string).Settings().set(settings: object): Promise<void>`

### `Index(indexId: string).Synonyms().list(): Promise<object[]>`

### `Index(indexId: string).Synonyms().create(input: string, synonyms: string[]): Promise<object>`

## 🎓 Guides

<details>
<summary>How to do Foo</summary>
Today we're gonna build Foo....
</details>

### 🕵️ Troubleshooting

## 🥂 License

[MIT](./LICENSE.md) as always
