import { ErrorStatusCode, EnqueuedUpdate } from '../src/types'
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
])('Test on sortable attributes', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get default sortable attributes`, async () => {
    try {
      const response: string[] = await client
        .index(index.uid)
        .getSortableAttributes()
      expect(response).toEqual([])
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Update sortable attributes`, async () => {
    const newSortableAttributes = ['title']
    try {
      const response: EnqueuedUpdate = await client
        .index(index.uid)
        .updateSortableAttributes(newSortableAttributes)
      expect(response).toHaveProperty('updateId', expect.any(Number))
      await client.index(index.uid).waitForPendingUpdate(response.updateId)
    } catch (error) {
      throw new Error(error)
    }

    try {
      const response: string[] = await client
        .index(index.uid)
        .getSortableAttributes()
      expect(response).toEqual(newSortableAttributes)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Update sortable attributes at null`, async () => {
    try {
      const response: EnqueuedUpdate = await client
        .index(index.uid)
        .updateSortableAttributes(null)
      expect(response).toHaveProperty('updateId', expect.any(Number))
      await client.index(index.uid).waitForPendingUpdate(response.updateId)
    } catch (error) {
      throw new Error(error)
    }

    try {
      const response: string[] = await client
        .index(index.uid)
        .getSortableAttributes()
      expect(response).toEqual([])
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Reset sortable attributes`, async () => {
    try {
      const response: EnqueuedUpdate = await client
        .index(index.uid)
        .resetSortableAttributes()
      expect(response).toHaveProperty('updateId', expect.any(Number))
      await client.index(index.uid).waitForPendingUpdate(response.updateId)
    } catch (error) {
      throw new Error(error)
    }

    try {
      const response: string[] = await client
        .index(index.uid)
        .getSortableAttributes()
      expect(response).toEqual([])
    } catch (error) {
      throw new Error(error)
    }
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on sortable attributes',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: try to get sortable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).getSortableAttributes()
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to update sortable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSortableAttributes([])
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to reset sortable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSortableAttributes()
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on sortable attributes',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: try to get sortable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).getSortableAttributes()
      ).rejects.toHaveProperty(
        'errorCode',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update sortable attributes and be denied`, async () => {
      const resetSortable: string[] = []
      await expect(
        client.index(index.uid).updateSortableAttributes(resetSortable)
      ).rejects.toHaveProperty(
        'errorCode',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset sortable attributes and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSortableAttributes()
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
  test(`Test getSortableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/sortable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getSortableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateSortableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/sortable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateSortableAttributes([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetSortableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/sortable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetSortableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
