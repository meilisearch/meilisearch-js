import { EnqueuedTask } from '../src/enqueued-task'
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

describe.each([{ permission: 'Master' }, { permission: 'Admin' }])(
  'Test on dictionary',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { taskUid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Get default dictionary`, async () => {
      const client = await getClient(permission)
      const response: string[] = await client.index(index.uid).getDictionary()

      expect(response).toEqual([])
    })

    test(`${permission} key: Update dictionary`, async () => {
      const client = await getClient(permission)
      const newDictionary = ['J. K.', 'J. R. R.']
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateDictionary(newDictionary)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string[] = await client.index(index.uid).getDictionary()

      expect(response).toEqual(newDictionary)
    })

    test(`${permission} key: Update dictionary with null value`, async () => {
      const client = await getClient(permission)
      const newDictionary = null
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateDictionary(newDictionary)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string[] = await client.index(index.uid).getDictionary()

      expect(response).toEqual([])
    })

    test(`${permission} key: Reset dictionary`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client.index(index.uid).resetDictionary()
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string[] = await client.index(index.uid).getDictionary()

      expect(response).toEqual([])
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getDictionary route`, async () => {
    const route = `indexes/${index.uid}/settings/dictionary`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getDictionary()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateDictionary route`, async () => {
    const route = `indexes/${index.uid}/settings/dictionary`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateDictionary([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetDictionary route`, async () => {
    const route = `indexes/${index.uid}/settings/dictionary`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetDictionary()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
