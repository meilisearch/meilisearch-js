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
])('Test on searchable attributes', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .getIndex(index.uid)
      .addDocuments(dataset)
    await masterClient.getIndex(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default searchable attributes`, async () => {
    await client
      .getIndex(index.uid)
      .getSearchableAttributes()
      .then((response: string[]) => {
        expect(response.sort()).toEqual(Object.keys(dataset[0]).sort())
      })
  })
  test(`${permission} key: Update searchable attributes`, async () => {
    const newSearchableAttributes = ['title']
    const { updateId } = await client
      .getIndex(index.uid)
      .updateSearchableAttributes(newSearchableAttributes)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(index.uid)
      .getSearchableAttributes()
      .then((response: string[]) => {
        expect(response).toEqual(newSearchableAttributes)
      })
  })
  test(`${permission} key: Reset searchable attributes`, async () => {
    const { updateId } = await client
      .getIndex(index.uid)
      .resetSearchableAttributes()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(index.uid)
      .getSearchableAttributes()
      .then((response: string[]) => {
        expect(response.sort()).toEqual(Object.keys(dataset[0]).sort())
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on searchable attributes',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getSearchableAttributes()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateSearchableAttributes([])
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetSearchableAttributes()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on searchable attributes',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getSearchableAttributes()
      ).rejects.toThrowError(`You must have an authorization token`)
    })
    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateSearchableAttributes([])
      ).rejects.toThrowError(`You must have an authorization token`)
    })
    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetSearchableAttributes()
      ).rejects.toThrowError(`You must have an authorization token`)
    })
  }
)
