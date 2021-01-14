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

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on distinct attribute', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await client.index(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default distinct attribute`, async () => {
    await client
      .index(index.uid)
      .getDistinctAttribute()
      .then((response: string | null) => {
        expect(response).toEqual(null)
      })
  })
  test(`${permission} key: Update distinct attribute`, async () => {
    const newDistinctAttribute = 'title'
    const { updateId } = await client
      .index(index.uid)
      .updateDistinctAttribute(newDistinctAttribute)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getDistinctAttribute()
      .then((response: string | null) => {
        expect(response).toEqual(newDistinctAttribute)
      })
  })
  test(`${permission} key: Reset distinct attribute`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetDistinctAttribute()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getDistinctAttribute()
      .then((response: string | null) => {
        expect(response).toEqual(null)
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on distinct attribute',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).getDistinctAttribute()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).updateDistinctAttribute('title')
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).resetDistinctAttribute()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on distinct attribute',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).getDistinctAttribute()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).updateDistinctAttribute('title')
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      await expect(
        client.index(index.uid).resetDistinctAttribute()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

test(`Get request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).getDistinctAttribute()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/distinct-attribute`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/distinct-attribute/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Update request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).updateDistinctAttribute('')
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/distinct-attribute`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/distinct-attribute/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Reset request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(index.uid).resetDistinctAttribute()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/distinct-attribute`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/settings/distinct-attribute/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
