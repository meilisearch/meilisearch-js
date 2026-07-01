# Meilisearch JavaScript Client

`meilisearch-js` is the official JavaScript client for Meilisearch.

- Install the package from npm.
- Connect to your Meilisearch instance.
- Start indexing and searching documents.

## Installation

```sh
pnpm add meilisearch
```

## Quick start

```ts
import { Meilisearch } from "meilisearch";

const client = new Meilisearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});

const index = client.index("movies");
await index.search("wonder");
```

## API reference

See the generated API reference at [`/api/`](/api/).
