import MeiliSearch from '../src'
import * as Types from '../src/types'
import { clearAllIndexes } from './meilisearch-test-utils'

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

const index = {
  uid: 'movies_test',
}
const emptyIndex = {
  uid: 'empty_test',
}

const dataset = [
  { id: 123, title: 'Pride and Prejudice', comment: 'A great book' },
  {
    id: 456,
    title: 'Le Petit Prince',
    comment: 'A french book about a prince that walks on little cute planets',
  },
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

jest.setTimeout(100 * 1000)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

beforeAll(async () => {
  await clearAllIndexes(config)
  await masterClient.createIndex(index)
  await masterClient.getIndex(index.uid).addDocuments(dataset)
  await sleep(500)
})

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on search', ({ client, permission }) => {})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on search',
  ({ client, permission }) => {
    test(`${permission} key: try to  and be denied`, async () => {
      await expect(client.stats()).rejects.toThrowError(
        `Invalid API key: ${PUBLIC_KEY}`
      )
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on search',
  ({ client, permission }) => {
    test(`${permission} key: try  and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: Need a token`
      )
    })
  }
)
