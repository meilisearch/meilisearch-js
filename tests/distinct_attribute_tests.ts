import { EnqueuedUpdate, ErrorStatusCode } from '../src/types'
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

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on distinct attribute', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await client.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get default distinct attribute`, async () => {
    try {
      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(null)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Update distinct attribute`, async () => {
    const newDistinctAttribute = 'title'
    try {
      const response: EnqueuedUpdate = await client
        .index(index.uid)
        .updateDistinctAttribute(newDistinctAttribute)
      expect(response).toHaveProperty('updateId', expect.any(Number))
      await client.index(index.uid).waitForPendingUpdate(response.updateId)
    } catch (error) {
      throw new Error(error)
    }

    try {
      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(newDistinctAttribute)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Update distinct attribute at null`, async () => {
    try {
      const response: EnqueuedUpdate = await client
        .index(index.uid)
        .updateDistinctAttribute(null)
      expect(response).toHaveProperty('updateId', expect.any(Number))
      await client.index(index.uid).waitForPendingUpdate(response.updateId)
    } catch (error) {
      throw new Error(error)
    }
    try {
      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(null)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Reset distinct attribute`, async () => {
    try {
      const response: EnqueuedUpdate = await client
        .index(index.uid)
        .resetDistinctAttribute()
      expect(response).toHaveProperty('updateId', expect.any(Number))
      await client.index(index.uid).waitForPendingUpdate(response.updateId)
    } catch (error) {
      throw new Error(error)
    }
    try {
      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(null)
    } catch (error) {
      throw new Error(error)
    }
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on distinct attribute',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).getDistinctAttribute()
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).updateDistinctAttribute('title')
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).resetDistinctAttribute()
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on distinct attribute',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).getDistinctAttribute()
      ).rejects.toHaveProperty(
        'errorCode',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).updateDistinctAttribute('title')
      ).rejects.toHaveProperty(
        'errorCode',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).resetDistinctAttribute()
      ).rejects.toHaveProperty(
        'errorCode',
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
  test(`Test getDistinctAttribute route`, async () => {
    const route = `indexes/${index.uid}/settings/distinct-attribute`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getDistinctAttribute()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateDistinctAttribute route`, async () => {
    const route = `indexes/${index.uid}/settings/distinct-attribute`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateDistinctAttribute('a')
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetDistinctAttribute route`, async () => {
    const route = `indexes/${index.uid}/settings/distinct-attribute`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetDistinctAttribute()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
