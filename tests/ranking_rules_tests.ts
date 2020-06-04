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

const defaultRankingRules = [
  'typo',
  'words',
  'proximity',
  'attribute',
  'wordsPosition',
  'exactness',
]

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on ranking rules', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index)
    const { updateId } = await masterClient
      .getIndex(index.uid)
      .addDocuments(dataset)
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default ranking rules`, async () => {
    await client
      .getIndex(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(defaultRankingRules)
      })
  })
  test(`${permission} key: Update ranking rules`, async () => {
    const new_rr = ['asc(title)', 'typo', 'desc(description)']
    const { updateId } = await client
      .getIndex(index.uid)
      .updateRankingRules(new_rr)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(new_rr)
      })
  })
  test(`${permission} key: Reset ranking rules`, async () => {
    const { updateId } = await client
      .getIndex(index.uid)
      .resetRankingRules()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(defaultRankingRules)
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on ranking rules',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index)
    })
    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getRankingRules()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateRankingRules([])
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetRankingRules()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on ranking rules',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index)
    })
    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getRankingRules()
      ).rejects.toThrowError(`You must have an authorization token`)
    })
    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateRankingRules([])
      ).rejects.toThrowError(`You must have an authorization token`)
    })
    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetRankingRules()
      ).rejects.toThrowError(`You must have an authorization token`)
    })
  }
)
