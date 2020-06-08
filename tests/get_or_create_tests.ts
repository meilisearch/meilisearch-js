import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  PUBLIC_KEY,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

// Test with no index created before
// Test with an index already existing
// Test with a primary-key in parameter
describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on getOrCreateIndex', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })
  test(`${permission} key: getOrCreateIndex without index created before`, async () => {
    const newIndex = await client.getOrCreateIndex(index.uid)
    expect(newIndex.uid).toEqual(index.uid)
    const newIndexInfo = await client.getIndex(newIndex.uid).show()
    expect(newIndexInfo.primaryKey).toEqual(null)

  })
  test(`${permission} key: getOrCreateIndex on already existing index`, async () => {
    await masterClient.createIndex(index)
    const newIndex = await client.getOrCreateIndex(index.uid)
    expect(newIndex.uid).toEqual(index.uid)
  })

  test(`${permission} key: getOrCreateIndex with primary key`, async () => {
    const newIndex = await client.getOrCreateIndex(index.uid, 'primaryKey')
    expect(newIndex.uid).toEqual(index.uid)
    const newIndexInfo = await client.getIndex(newIndex.uid).show()
    expect(newIndexInfo.primaryKey).toEqual('primaryKey')
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on getOrCreateIndex',
  ({ client, permission }) => {
    test(`${permission} key: try to getOrCreateIndex and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getAcceptNewFields()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on getOrCreateIndex',
  ({ client, permission }) => {
    test(`${permission} key: try to getOrCreateIndex and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getAcceptNewFields()
      ).rejects.toThrowError(`You must have an authorization token`)
    })
  }
)
