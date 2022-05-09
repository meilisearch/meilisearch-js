import { MeiliSearch, MeiliSearchTimeOutError, Index, sleep } from '../src/'
import { Config, EnqueuedDump } from '../src/types'

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
  const { results: keys } = await masterClient.getKeys()

  if (permission === 'Public') {
    const key = keys.find((key: any) =>
      key.description.startsWith('Default Search API')
    )?.key
    return key || ''
  }

  if (permission === 'Private') {
    const key = keys.find((key: any) =>
      key.description.startsWith('Default Admin API')
    )?.key
    return key || ''
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
    const searchKey = await getKey(permission)
    const publicClient = new MeiliSearch({
      host: HOST,
      apiKey: searchKey,
    })
    return publicClient
  }

  if (permission === 'Private') {
    const adminKey = await getKey(permission)
    const privateClient = new MeiliSearch({
      host: HOST,
      apiKey: adminKey,
    })
    return privateClient
  }

  return masterClient
}

const clearAllIndexes = async (config: Config): Promise<void> => {
  const client = new MeiliSearch(config)

  const response = await client.getRawIndexes()
  const indexes = response.map((elem) => elem.uid)

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

function decode64(buff: string) {
  return Buffer.from(buff, 'base64').toString()
}

const datasetWithNests = [
  {
    id: 1,
    title: 'Pride and Prejudice',
    info: {
      comment: 'A great book',
      reviewNb: 500,
    },
  },
  {
    id: 2,
    title: 'Le Petit Prince',
    info: {
      comment: 'A french book',
      reviewNb: 600,
    },
  },
  {
    id: 3,
    title: 'Le Rouge et le Noir',
    info: {
      comment: 'Another french book',
      reviewNb: 700,
    },
  },
  {
    id: 4,
    title: 'Alice In Wonderland',
    info: {
      comment: 'A weird book',
      reviewNb: 800,
    },
  },
  {
    id: 5,
    title: 'The Hobbit',
    info: {
      comment: 'An awesome book',
      reviewNb: 900,
    },
  },
  {
    id: 6,
    title: 'Harry Potter and the Half-Blood Prince',
    info: {
      comment: 'The best book',
      reviewNb: 1000,
    },
  },
  { id: 7, title: "The Hitchhiker's Guide to the Galaxy" },
]

const dataset = [
  { id: 123, title: 'Pride and Prejudice', comment: 'A great book' },
  { id: 456, title: 'Le Petit Prince', comment: 'A french book' },
  { id: 2, title: 'Le Rouge et le Noir', comment: 'Another french book' },
  { id: 1, title: 'Alice In Wonderland', comment: 'A weird book' },
  { id: 1344, title: 'The Hobbit', comment: 'An awesome book' },
  {
    id: 4,
    title: 'Harry Potter and the Half-Blood Prince',
    comment: 'The best book',
  },
  { id: 42, title: "The Hitchhiker's Guide to the Galaxy" },
]

export type Book = {
  id: number
  title: string
  comment: string
}

export {
  clearAllIndexes,
  config,
  masterClient,
  badHostClient,
  anonymousClient,
  BAD_HOST,
  HOST,
  MASTER_KEY,
  MeiliSearch,
  Index,
  waitForDumpProcessing,
  getClient,
  getKey,
  decode64,
  dataset,
  datasetWithNests,
}
