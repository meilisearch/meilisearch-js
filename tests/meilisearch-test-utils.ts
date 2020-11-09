import MeiliSearch from '../src/meilisearch'
import * as Types from '../src/types'
import { sleep } from '../src/utils'

// testing
const MASTER_KEY = 'masterKey'
const HOST = 'http://127.0.0.1:7700'
const PRIVATE_KEY =
  '8dcbb482663333d0280fa9fedf0e0c16d52185cb67db494ce4cd34da32ce2092'
const PUBLIC_KEY =
  '3b3bf839485f90453acc6159ba18fbed673ca88523093def11a9b4f4320e44a5'

const config = {
  host: HOST,
  apiKey: MASTER_KEY,
}
const masterClient = new MeiliSearch({
  host: HOST,
  apiKey: MASTER_KEY,
})
const privateClient = new MeiliSearch({
  host: HOST,
  apiKey: PRIVATE_KEY,
})
const publicClient = new MeiliSearch({
  host: HOST,
  apiKey: PUBLIC_KEY,
})
const anonymousClient = new MeiliSearch({
  host: HOST,
})

const clearAllIndexes = async (config: Types.Config): Promise<void> => {
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

async function waitForDumpProcessing(
  dumpId: string,
  client: MeiliSearch,
  {
    timeOutMs = 5000,
    intervalMs = 50,
  }: { timeOutMs?: number; intervalMs?: number } = {}
): Promise<Types.EnqueuedDump> {
  const startingTime = Date.now()
  while (Date.now() - startingTime < timeOutMs) {
    const response = await client.getDumpStatus(dumpId)
    if (response.status !== 'in_progress') return response
    await sleep(intervalMs)
  }
  throw new Types.MeiliSearchTimeOutError(
    `timeout of ${timeOutMs}ms has exceeded on process ${dumpId} when waiting for the dump creation process to be done.`
  )
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
  MASTER_KEY,
  MeiliSearch,
  waitForDumpProcessing,
}
