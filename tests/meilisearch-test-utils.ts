import { MeiliSearch, MeiliSearchTimeOutError, Index, sleep } from '../src/'
import { Config, IndexResponse, EnqueuedDump } from '../src/types'

// testing
const MASTER_KEY = 'masterKey'
const HOST = 'http://127.0.0.1:7700'
const BAD_HOST = HOST.slice(0, -1) + `1`

// TODO: Very big breaking
const PRIVATE_KEY =
  'sw3qLtL1e2ee6b9297b2f7e849e01ea05ae56812ab8bad4d2d07fbf6184801037315843d'
const PUBLIC_KEY =
  'CTCsHvuX9291c3890d904199615a3a2adb4482b3c38d322750c1072922bdfa73a48d7db4'

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

  const taskIds = []
  for (const indexUid of indexes) {
    const { uid } = await client.index(indexUid).delete()
    taskIds.push(uid)
  }
  await client.waitForTasks(taskIds)

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
