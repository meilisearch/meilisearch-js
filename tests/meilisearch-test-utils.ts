import { MeiliSearch, MeiliSearchTimeOutError, Index, sleep } from '../src/'
import { Config, IndexResponse, EnqueuedDump } from '../src/types'

// testing
const MASTER_KEY = 'masterKey'
const HOST = 'http://127.0.0.1:7700'
const BAD_HOST = HOST.slice(0, -1) + `1`
const PRIVATE_KEY =
  '8dcbb482663333d0280fa9fedf0e0c16d52185cb67db494ce4cd34da32ce2092'
const PUBLIC_KEY =
  '3b3bf839485f90453acc6159ba18fbed673ca88523093def11a9b4f4320e44a5'

const config = {
  host: HOST,
  apiKey: MASTER_KEY,
}
const badHostClient = new MeiliSearch({
  host: BAD_HOST,
  apiKey: MASTER_KEY,
})
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

const clearAllIndexes = async (config: Config): Promise<void> => {
  const client = new MeiliSearch(config)

  const response: IndexResponse[] = await client.getIndexes()
  const indexes = response.map((elem: IndexResponse) => elem.uid)

  for (const indexUid of indexes) {
    await client
      .index(indexUid)
      .delete()
      .catch((err: any) => {
        expect(err).toBe(null)
      })
  }

  await expect(client.getIndexes()).resolves.toHaveLength(0)
}

async function waitForDumpProcessing(
  dumpId: string,
  client: MeiliSearch,
  {
    timeOutMs = 5000,
    intervalMs = 50,
  }: { timeOutMs?: number; intervalMs?: number } = {}
): Promise<EnqueuedDump> {
  const startingTime = Date.now()
  while (Date.now() - startingTime < timeOutMs) {
    const response = await client.getDumpStatus(dumpId)
    if (response.status !== 'in_progress') return response
    await sleep(intervalMs)
  }
  throw new MeiliSearchTimeOutError(
    `timeout of ${timeOutMs}ms has exceeded on process ${dumpId} when waiting for the dump creation process to be done.`
  )
}

export {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  badHostClient,
  anonymousClient,
  BAD_HOST,
  PUBLIC_KEY,
  PRIVATE_KEY,
  MASTER_KEY,
  MeiliSearch,
  Index,
  waitForDumpProcessing,
}
