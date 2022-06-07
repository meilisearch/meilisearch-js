import { ErrorStatusCode, EnqueuedTask } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from './utils/meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on stop words',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')

      const { uid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(uid)
    })

    test(`${permission} key: Get default stop words`, async () => {
      const client = await getClient(permission)
      const response: string[] = await client.index(index.uid).getStopWords()
      expect(response).toEqual([])
    })

    test(`${permission} key: Update stop words`, async () => {
      const client = await getClient(permission)
      const newStopWords = ['the']
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateStopWords(newStopWords)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client.index(index.uid).getStopWords()
      expect(response).toEqual(newStopWords)
    })

    test(`${permission} key: Update stop words with null value`, async () => {
      const client = await getClient(permission)
      const newStopWords = null
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateStopWords(newStopWords)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client.index(index.uid).getStopWords()
      expect(response).toEqual([])
    })

    test(`${permission} key: Reset stop words`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client.index(index.uid).resetStopWords()
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.index(index.uid).waitForTask(task.uid)

      const response: string[] = await client.index(index.uid).getStopWords()
      expect(response).toEqual([])
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on stop words',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get stop words and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getStopWords()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update stop words and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateStopWords([])
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset stop words and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetStopWords()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on stop words',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get stop words and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getStopWords()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update stop words and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateStopWords([])
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset stop words and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetStopWords()
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
  test(`Test getStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getStopWords()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateStopWords([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetStopWords()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
