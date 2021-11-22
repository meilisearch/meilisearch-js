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
    const response: string[] = await client
      .index(index.uid)
      .getFilterableAttributes()
    expect(response.sort()).toEqual([])
  })

  test(`${permission} key: Update attributes for filtering`, async () => {
    const newFilterableAttributes = ['genre']
    const attributes: EnqueuedUpdate = await client
      .index(index.uid)
      .updateFilterableAttributes(newFilterableAttributes)
    expect(attributes).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(attributes.updateId)

    const response: string[] = await client
      .index(index.uid)
      .getFilterableAttributes()
    expect(response).toEqual(newFilterableAttributes)
  })

  test(`${permission} key: Update attributes for filtering at null`, async () => {
    const attrbiutes: EnqueuedUpdate = await client
      .index(index.uid)
      .updateFilterableAttributes(null)
    expect(attrbiutes).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(attrbiutes.updateId)

    const response: string[] = await client
      .index(index.uid)
      .getFilterableAttributes()
    expect(response.sort()).toEqual([])
  })

  test(`${permission} key: Reset attributes for filtering`, async () => {
    const attrbiutes: EnqueuedUpdate = await client
      .index(index.uid)
      .resetFilterableAttributes()
    expect(attrbiutes).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(attrbiutes.updateId)

    const response: string[] = await client
      .index(index.uid)
      .getFilterableAttributes()
    expect(response.sort()).toEqual([])
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
        client.index(index.uid).getFilterableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).updateFilterableAttributes([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).resetFilterableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
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
        client.index(index.uid).getFilterableAttributes()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).updateFilterableAttributes([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset attributes for filtering and be denied`, async () => {
      await expect(
        client.index(index.uid).resetFilterableAttributes()
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
  test(`Test getFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getFilterableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateFilterableAttributes([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetFilterableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/filterable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetFilterableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
