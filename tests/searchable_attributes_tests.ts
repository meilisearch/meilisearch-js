import { ErrorStatusCode, EnqueuedTask } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on searchable attributes',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(uid)
      await client.index(index.uid).waitForTask(uid)
    })

    test(`${permission} key: Get default searchable attributes`, async () => {
      const client = await getClient(permission)
      const response: string[] = await client
        .index(index.uid)
        .getSearchableAttributes()
      expect(response).toEqual(['*'])
    })

    test(`${permission} key: Update searchable attributes`, async () => {
      const client = await getClient(permission)
      const newSearchableAttributes = ['title']
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateSearchableAttributes(newSearchableAttributes)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getSearchableAttributes()
      expect(response).toEqual(newSearchableAttributes)
    })

    test(`${permission} key: Update searchable attributes at null`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateSearchableAttributes(null)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getSearchableAttributes()
      expect(response).toEqual(['*'])
    })

    test(`${permission} key: Reset searchable attributes`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetSearchableAttributes()
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client
        .index(index.uid)
        .getSearchableAttributes()
      expect(response).toEqual(['*'])
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on searchable attributes',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getSearchableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateSearchableAttributes([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetSearchableAttributes()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on searchable attributes',
  ({ permission }) => {
    beforeAll(async () => {
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    test(`${permission} key: try to get searchable attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getSearchableAttributes()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update searchable attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateSearchableAttributes([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset searchable attributes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetSearchableAttributes()
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
  test(`Test getSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getSearchableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateSearchableAttributes([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetSearchableAttributes route`, async () => {
    const route = `indexes/${index.uid}/settings/searchable-attributes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetSearchableAttributes()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
