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
  'Test on synonyms',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(uid)
    })
    test(`${permission} key: Get default synonyms`, async () => {
      const client = await getClient(permission)
      const response: object = await client.index(index.uid).getSynonyms()
      expect(response).toEqual({})
    })
    test(`${permission} key: Update synonyms`, async () => {
      const client = await getClient(permission)
      const newSynonyms = {
        hp: ['harry potter'],
      }
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateSynonyms(newSynonyms)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.waitForTask(task.uid)

      const response: object = await client.index(index.uid).getSynonyms()
      expect(response).toEqual(newSynonyms)
    })

    test(`${permission} key: Update synonyms with null value`, async () => {
      const client = await getClient(permission)
      const newSynonyms = null
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateSynonyms(newSynonyms)
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.waitForTask(task.uid)

      const response: object = await client.index(index.uid).getSynonyms()
      expect(response).toEqual({})
    })

    test(`${permission} key: Reset synonyms`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client.index(index.uid).resetSynonyms()
      expect(task).toHaveProperty('uid', expect.any(Number))
      await client.waitForTask(task.uid)

      const response: object = await client.index(index.uid).getSynonyms()
      expect(response).toEqual({})
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on synonyms',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get synonyms and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getSynonyms()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update synonyms and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateSynonyms({})
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset synonyms and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetSynonyms()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])('Test on synonyms', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })

  test(`${permission} key: try to get synonyms and be denied`, async () => {
    const client = await getClient(permission)
    await expect(client.index(index.uid).getSynonyms()).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })

  test(`${permission} key: try to update synonyms and be denied`, async () => {
    const client = await getClient(permission)
    await expect(
      client.index(index.uid).updateSynonyms({})
    ).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })

  test(`${permission} key: try to reset synonyms and be denied`, async () => {
    const client = await getClient(permission)
    await expect(
      client.index(index.uid).resetSynonyms()
    ).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })
})

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getSynonyms()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateSynonyms({})
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetSynonyms()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
