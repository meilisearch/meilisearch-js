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
  'Test on proximity precision',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { taskUid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Get default proximity precision`, async () => {
      const client = await getClient(permission)
      const response: string = await client
        .index(index.uid)
        .getProximityPrecision()

      expect(response).toEqual(null)
    })

    test(`${permission} key: Update proximity precision with 'byAttribute' value`, async () => {
      const client = await getClient(permission)
      const newProximityPrecision = 'byAttribute'
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateProximityPrecision(newProximityPrecision)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string = await client
        .index(index.uid)
        .getProximityPrecision()

      expect(response).toEqual(newProximityPrecision)
    })

    test(`${permission} key: Update proximity precision with 'byWord' value`, async () => {
      const client = await getClient(permission)
      const newProximityPrecision = 'byWord'
      const task: EnqueuedTask = await client
        .index(index.uid)
        .updateProximityPrecision(newProximityPrecision)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string = await client
        .index(index.uid)
        .getProximityPrecision()

      expect(response).toEqual(newProximityPrecision)
    })

    test(`${permission} key: Reset proximity precision`, async () => {
      const client = await getClient(permission)
      const task: EnqueuedTask = await client
        .index(index.uid)
        .resetProximityPrecision()
      await client.index(index.uid).waitForTask(task.taskUid)

      const response: string = await client
        .index(index.uid)
        .getProximityPrecision()

      expect(response).toEqual(null)
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getProximityPrecision route`, async () => {
    const route = `indexes/${index.uid}/settings/proximity-precision`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getProximityPrecision()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateProximityPrecision route`, async () => {
    const route = `indexes/${index.uid}/settings/proximity-precision`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateProximityPrecision('byAttribute')
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetProximityPrecision route`, async () => {
    const route = `indexes/${index.uid}/settings/proximity-precision`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetProximityPrecision()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
