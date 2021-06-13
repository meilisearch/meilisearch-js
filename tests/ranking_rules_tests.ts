import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  badHostClient,
  BAD_HOST,
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
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await client.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get default ranking rules`, async () => {
    await client
      .index(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(defaultRankingRules)
      })
  })

  test(`${permission} key: Update ranking rules`, async () => {
    const newRankingRules = ['asc(title)', 'typo', 'desc(description)']
    const { updateId } = await client
      .index(index.uid)
      .updateRankingRules(newRankingRules)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(newRankingRules)
      })
  })

  test(`${permission} key: Update ranking rules at null`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .updateRankingRules(null)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(defaultRankingRules)
      })
  })

  test(`${permission} key: Reset ranking rules`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetRankingRules()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getRankingRules()
      .then((response: string[]) => {
        expect(response).toEqual(defaultRankingRules)
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on ranking rules',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).getRankingRules()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on ranking rules',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).getRankingRules()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe('Tests on url construction', () => {
  test(`Test getRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    await expect(
      badHostClient.index(index.uid).getRankingRules()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    await expect(
      badHostClient.index(index.uid).updateRankingRules([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    await expect(
      badHostClient.index(index.uid).resetRankingRules()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
