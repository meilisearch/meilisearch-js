# TypeScript Node demo

## Requirements

Build the base project `/meilisearch-js` as this example uses the locally build bundles from `meilisearch-js`.

```
cd meilisearch-js
yarn build
```

## Credentials

This example uses the following MeiliSearch address: `http://127.0.0.1:7700`. Feel free to change the credentials to meet your MeiliSearch address.

The credentials are written in `src/index.ts`.

## Try out

To try it out you need to follow these steps:

### 1. Install dependencies

```bash
yarn
```

### 2. Build

```bash
yarn build
```

### 3. Execute

```bash
node build/bundle.js
```
