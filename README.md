# MeiliSearch Javascript Client

[![NPM version](https://img.shields.io/npm/v/meilisearch.svg)](https://www.npmjs.com/package/meilisearch)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Licence](https://img.shields.io/badge/licence-MIT-blue.svg)](https://img.shields.io/badge/licence-MIT-blue.svg)

The Javascript client for MeiliSearch API.

MeiliSearch provides an ultra relevant and instant full-text search. Our solution is open-source and you can check out [our repository here](https://github.com/meilisearch/MeiliSearch).

Here is the [MeiliSearch documentation](https://docs.meilisearch.com/) 📖

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
const Meili = require('meilisearch')

// Credentials of your MeiliSearch Instance
const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const meili = new Meili(config)

meili
  .Index('movies')
  .search('batman')
  .then((response) => {
    console.log(response.hits)
  })
```

## 🎭 Examples

Go checkout [examples](./examples)!

## 📜 API Examples

### Make a search

**Example:**

```js
meili
  .Index('movies')
  .search('batman')
  .then((response) => {
    console.log(response.hits)
  })
```

**Response:**

```json
{
  "hits": [
    {
      "id": "2661",
      "title": "Batman",
      "poster": "https://image.tmdb.org/t/p/w1280/udDVJXtAFsQ8DimrXkVFqy4DGEQ.jpg",
      "overview": "The Dynamic Duo faces four super-villains who plan to hold the world for ransom with the help of a secret invention that instantly dehydrates people.",
      "release_date": -108086400
    },
    {
      "id": "268",
      "title": "Batman",
      "poster": "https://image.tmdb.org/t/p/w1280/kBf3g9crrADGMc2AMAMlLBgSm2h.jpg",
      "overview": "The Dark Knight of Gotham City begins his war on crime with his first major enemy being the clownishly homicidal Joker, who has seized control of Gotham's underworld.",
      "release_date": 614566800
    },
    {
      "id": "29751",
      "title": "Batman Unmasked: The Psychology of the Dark Knight",
      "poster": "https:/0/image.tmdb.org/t/p/w1280/jjHu128XLARc2k4cJrblAvZe0HE.jpg",
      "overview": "Delve into the world of Batman and the vigilante justice that he brought to the city of Gotham. Batman is a man who, after experiencing great tragedy, devotes his life to an ideal--but what happens when one man takes on the evil underworld alone? Examine why Batman is who he is--and explore how a boy scarred by tragedy becomes a symbol of hope to everyone else.",
      "release_date": 1216083600
    }
  ],
  "offset": 0,
  "limit": 3,
  "processingTimeMs": 4,
  "query": "batman"
}
```

### List existing indexes

This methods list all indexes of a database

**Example:**

```js
meili.listIndexes().then((indexes) => {
  console.log(indexes)
})
```

**Response:**

```json
[
  {
    "name": "Movies",
    "uid": "movies",
    "createdAt": "2019-11-25T14:06:54.340482Z",
    "updatedAt": "2019-11-25T14:07:00.736937Z"
  }
]
```

### Create new index

This methods create a new index

**Example:**

```js
meili
  .createIndex({
    name: 'Movie',
    uid: 'movies',
  })
  .then((index) => {
    console.log(index)
  })
```

**Response:**

```json
{
  "name": "Movies",
  "uid": "movies",
  "createdAt": "2019-11-25T14:38:49.846352Z",
  "updatedAt": "2019-11-25T14:38:49.846353Z"
}
```

### Push some documents

Will push to the indexing queue documents on body

**Example:**

```js
meili
  .Index('movies')
  .addDocuments([
    {
      id: 1,
      title: 'My awesome movie',
    },
  ])
  .then((response) => {
    console.log(response)
  })
```

**Response:**

```json
{
  "updateId": 1
}
```

The method `add_documents` is **[asynchronous](https://docs.meilisearch.com/guides/advanced_guides/asynchronous_updates.html)**.<br/>

### Get some documents

getDocuments is a method to get defaults documents without search. This method is usually used to display results when you have no input in the search bar.

**Example:**

```js
meili
  .Index('movies')
  .getDocuments({
    limit: 3,
  })
  .then((response) => {
    console.log(response)
  })
```

**Reponse:**

```json
[
  {
    "id": "279664",
    "title": "Green Chair 2013 - Love Conceptually",
    "poster": "https://image.tmdb.org/t/p/w1280/9H8vACDBSBs8NXO6NfLH3i9ZsYq.jpg",
    "overview": "Moon-hee is an attractive woman who runs an art academy after returning from the States. She lives apart from her husband who won't divorce her and enjoys a free relationship with In-gyu, her lover of long time and Professor Yoon whom she's been privately involved with for a long time. On the other hand, her young student Joo Won only draws her face during class. He fell in love with her when he saw Moon-hee as a bride at the wedding his grandma took him too. He started art because of her and started attending the academy. He thinks it's destiny. Moon-hee is attracted to Joo Won's pure heart until they share love in in a studio where it's just them....",
    "release_date": 1383177600
  },
  {
    "id": "13342",
    "title": "Fast Times at Ridgemont High",
    "poster": "https://image.tmdb.org/t/p/w1280/9y5rSeO0xH3m5oRJmhBusDkiS0j.jpg",
    "overview": "Follows a group of high school students growing up in southern California, based on the real-life adventures chronicled by Cameron Crowe. Stacy Hamilton and Mark Ratner are looking for a love interest, and are helped along by their older classmates, Linda Barrett and Mike Damone, respectively. The center of the film is held by Jeff Spicoli, a perpetually stoned surfer dude who faces off with the resolute Mr. Hand, who is convinced that everyone is on dope.",
    "release_date": 398048400
  },
  {
    "id": "25087",
    "title": "Bloodsport II",
    "poster": "https://image.tmdb.org/t/p/w1280/xVfSGAbOK4FucTwkYrXJjeBFqv4.jpg",
    "overview": "After thief Alex Cardo gets caught while stealing an ancient katana in East Asia, he soon finds himself imprisoned and beaten up by the crowd there. One of the guards, Demon, feels upset by Alex appearance and tortures him as often as he gets the opportunity. Alex finds a friend and mentor in the jailhouse, Master Sun, who teaches him a superior fighting style called Iron Hand. When a 'best of the best kumite' is to take place, Demon gets an invitation. Now Master Sun and Alex need to find a way to let Alex take part in the kumite too.",
    "release_date": 825638400
  }
]
```

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

`meili.Index('xxx').getUpdate(updateId: number): Promise<object>`

- Get all updates info:

`meili.Index('xxx').getAllUpdates(): Promise<object[]>`

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
