import { MeiliSearch, MeiliSearchTimeOutError, Index, sleep } from '../src/'
import { Config, IndexResponse, EnqueuedDump } from '../src/types'
import 'cross-fetch/polyfill'

// testing
const MASTER_KEY = 'masterKey'
const HOST = 'http://127.0.0.1:7700'
const BAD_HOST = HOST.slice(0, -1) + `1`

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

const anonymousClient = new MeiliSearch({
  host: HOST,
})

async function getKey(permission: string): Promise<string> {
  if (permission === 'No') {
    return ''
  }
  const res: Record<string, any> = await fetch('http://localhost:7700/keys', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${MASTER_KEY}`,
    },
  })
  const keys = await res.json()

  if (permission === 'Public') {
    return keys.find((key: any) =>
      key.description.startsWith('Default Search API')
    ).key
  }

  if (permission === 'Private') {
    return keys.find((key: any) =>
      key.description.startsWith('Default Admin API')
    ).key
  }
  return MASTER_KEY
}

async function getClient(permission: string): Promise<MeiliSearch> {
  if (permission === 'No') {
    const anonymousClient = new MeiliSearch({
      host: HOST,
    })
    return anonymousClient
  }

  if (permission === 'Public') {
    const publicKey = await getKey(permission)
    const publicClient = new MeiliSearch({
      host: HOST,
      apiKey: publicKey,
    })
    return publicClient
  }

  if (permission === 'Private') {
    const privateKey = await getKey(permission)
    const privateClient = new MeiliSearch({
      host: HOST,
      apiKey: privateKey,
    })
    return privateClient
  }

  return masterClient
}

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
  badHostClient,
  anonymousClient,
  BAD_HOST,
  MASTER_KEY,
  MeiliSearch,
  Index,
  waitForDumpProcessing,
  getClient,
  getKey,
}
