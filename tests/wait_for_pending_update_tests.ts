import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

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

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on wait-for-pending-update', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
  })
  test(`${permission} key: Get WaitForPendingStatus until done and resolved`, async () => {
    const { updateId } = await client.getIndex(index.uid).addDocuments(dataset)
    const update = await client
      .getIndex(index.uid)
      .waitForPendingUpdate(updateId)
    expect(update).toHaveProperty('status', 'processed')
  })
  test(`${permission} key: Get WaitForPendingStatus with custom interval and timeout until done and resolved`, async () => {
    const { updateId } = await client.getIndex(index.uid).addDocuments(dataset)
    const update = await client
      .getIndex(index.uid)
      .waitForPendingUpdate(updateId, {
        timeOutMs: 6000,
        intervalMs: 100,
      })
    expect(update).toHaveProperty('status', 'processed')
  })
  test(`${permission} key: Get WaitForPendingStatus with custom timeout and interval at 0 done and resolved`, async () => {
    const { updateId } = await client.getIndex(index.uid).addDocuments(dataset)
    const update = await client
      .getIndex(index.uid)
      .waitForPendingUpdate(updateId, {
        timeOutMs: 6000,
        intervalMs: 0,
      })
    expect(update).toHaveProperty('status', 'processed')
  })

  test(`${permission} key: Try to WaitForPendingStatus with small timeout and raise an error`, async () => {
    const { updateId } = await client.getIndex(index.uid).addDocuments(dataset)
    await expect(
      client
        .getIndex(index.uid)
        .waitForPendingUpdate(updateId, { timeOutMs: 0 })
    ).rejects.toThrowError(
      `timeout of 0ms has exceeded on process 0 when waiting for pending update to resolve.`
    )
  })
})
