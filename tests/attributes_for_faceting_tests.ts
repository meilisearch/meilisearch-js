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
  { id: 123, title: 'Pride and Prejudice', genre: 'romance' },
  { id: 456, title: 'Le Petit Prince', genre: 'adventure' },
  { id: 2, title: 'Le Rouge et le Noir', genre: 'romance' },
  { id: 1, title: 'Alice In Wonderland', genre: 'adventure' },
  { id: 1344, title: 'The Hobbit', genre: 'adventure' },
  {
    id: 4,
    title: 'Harry Potter and the Half-Blood Prince',
    genre: 'fantasy',
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
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get default attributes for filtering`, async () => {
    await client
      .index(index.uid)
      .getAttributesForFaceting()
      .then((response: string[]) => {
        expect(response.sort()).toEqual([])
      })
  })

  test(`${permission} key: Update attributes for filtering`, async () => {
    const newAttributesForFaceting = ['genre']
    const { updateId } = await client
      .index(index.uid)
      .updateAttributesForFaceting(newAttributesForFaceting)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getAttributesForFaceting()
      .then((response: string[]) => {
        expect(response).toEqual(newAttributesForFaceting)
      })
  })

  test(`${permission} key: Update attributes for filtering at null`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .updateAttributesForFaceting(null)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getAttributesForFaceting()
      .then((response: string[]) => {
        expect(response.sort()).toEqual([])
      })
  })

  test(`${permission} key: Reset attributes for filtering`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetAttributesForFaceting()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getAttributesForFaceting()
      .then((response: string[]) => {
        expect(response.sort()).toEqual([])
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on attributes for filtering',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: try to get attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).getAttributesForFaceting()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).updateAttributesForFaceting([])
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).resetAttributesForFaceting()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on attributes for filtering',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: try to get attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).getAttributesForFaceting()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).updateAttributesForFaceting([])
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).resetAttributesForFaceting()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe('Tests on url construction', () => {
  test(`Test getAttributesForFaceting route`, async () => {
    const route = `indexes/${index.uid}/settings/attributes-for-faceting`
    await expect(
      badHostClient.index(index.uid).getAttributesForFaceting()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateAttributesForFaceting route`, async () => {
    const route = `indexes/${index.uid}/settings/attributes-for-faceting`
    await expect(
      badHostClient.index(index.uid).updateAttributesForFaceting([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetAttributesForFaceting route`, async () => {
    const route = `indexes/${index.uid}/settings/attributes-for-faceting`
    await expect(
      badHostClient.index(index.uid).resetAttributesForFaceting()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
