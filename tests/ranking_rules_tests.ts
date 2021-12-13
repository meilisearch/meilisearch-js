import { ErrorStatusCode, EnqueuedTask } from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  BAD_HOST,
  MeiliSearch,
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
  'words',
  'typo',
  'proximity',
  'attribute',
  'sort',
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
    const response: string[] = await client.index(index.uid).getRankingRules()
    expect(response).toEqual(defaultRankingRules)
  })

  test(`${permission} key: Update ranking rules`, async () => {
    const newRankingRules = ['title:asc', 'typo', 'description:desc']
    const rankingRules: EnqueuedTask = await client
      .index(index.uid)
      .updateRankingRules(newRankingRules)
    expect(rankingRules).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(rankingRules.updateId)

    const response: string[] = await client.index(index.uid).getRankingRules()
    expect(response).toEqual(newRankingRules)
  })

  test(`${permission} key: Update ranking rules at null`, async () => {
    const rankingRules: EnqueuedTask = await client
      .index(index.uid)
      .updateRankingRules(null)
    expect(rankingRules).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(rankingRules.updateId)

    const response: string[] = await client.index(index.uid).getRankingRules()
    expect(response).toEqual(defaultRankingRules)
  })

  test(`${permission} key: Reset ranking rules`, async () => {
    const rankingRules: EnqueuedTask = await client
      .index(index.uid)
      .resetRankingRules()
    expect(rankingRules).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(rankingRules.updateId)

    const response: string[] = await client.index(index.uid).getRankingRules()
    expect(response).toEqual(defaultRankingRules)
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
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
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
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).updateRankingRules([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset ranking rules and be denied`, async () => {
      await expect(
        client.index(index.uid).resetRankingRules()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getRankingRules()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateRankingRules([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetRankingRules route`, async () => {
    const route = `indexes/${index.uid}/settings/ranking-rules`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetRankingRules()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
