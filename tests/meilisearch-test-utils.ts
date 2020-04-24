import MeiliSearch from '../src/meilisearch'
import * as Types from '../src/types'

const { HOST: host, MASTER_KEY, PRIVATE_KEY, PUBLIC_KEY } = process.env

const config = {
  host,
  apiKey: MASTER_KEY,
}
const masterClient = new MeiliSearch({
  host,
  apiKey: MASTER_KEY,
})
const privateClient = new MeiliSearch({
  host,
  apiKey: PRIVATE_KEY,
})
const publicClient = new MeiliSearch({
  host,
  apiKey: PUBLIC_KEY,
})
const anonymousClient = new MeiliSearch({
  host,
})

const clearAllIndexes = async (config) => {
  const client = new MeiliSearch(config)
  const indexes = await client
    .listIndexes()
    .then((response: Types.IndexResponse[]): string[] => {
      return response.map((elem: Types.IndexResponse) => elem.uid)
    })

  for (const indexUid of indexes) {
    await client
      .getIndex(indexUid)
      .deleteIndex()
      .catch((err) => {
        expect(err).toBe(null)
      })
  }

  await expect(client.listIndexes()).resolves.toHaveLength(0)
}

export {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  PUBLIC_KEY,
  PRIVATE_KEY,
}
