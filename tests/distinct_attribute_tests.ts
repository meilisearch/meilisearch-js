import { EnqueuedTask, ErrorStatusCode } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
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

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on distinct attribute',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('master')

      const { uid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(uid)
    })

    test(`${permission} key: Get default distinct attribute`, async () => {
      const client = await getClient(permission)
      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(null)
    })

    test(`${permission} key: Update distinct attribute`, async () => {
      const client = await getClient(permission)
      const newDistinctAttribute = 'title'
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateDistinctAttribute(newDistinctAttribute)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(newDistinctAttribute)
    })

    test(`${permission} key: Update distinct attribute at null`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateDistinctAttribute(null)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(null)
    })

    test(`${permission} key: Reset distinct attribute`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetDistinctAttribute()
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string | null = await client
        .index(index.uid)
        .getDistinctAttribute()
      expect(response).toEqual(null)
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on distinct attribute',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getDistinctAttribute()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateDistinctAttribute('title')
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetDistinctAttribute()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on distinct attribute',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get distinct attribute and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getDistinctAttribute()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update distinct attribute and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateDistinctAttribute('title')
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset distinct attribute and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetDistinctAttribute()
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
