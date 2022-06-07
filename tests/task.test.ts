import { ErrorStatusCode, EnqueuedTask, Task, TaskStatus } from '../src/types'
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
  'Test on updates',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    test(`${permission} key: Get one enqueued task`, async () => {
      const client = await getClient(permission)
      const response: EnqueuedTask = await client
        .index(index.uid)
        .addDocuments(dataset)
      expect(response).toHaveProperty('uid', expect.any(Number))
      expect(response).toHaveProperty('indexUid', index.uid)
      expect(response).toHaveProperty('status')
      expect(response).toHaveProperty('type', 'documentAddition')
      expect(response).toHaveProperty('enqueuedAt')
      await client.waitForTask(response.uid)

      const stausReponse: Task = await client
        .index(index.uid)
        .getTask(response.uid)

      expect(stausReponse).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
      expect(stausReponse).toHaveProperty('uid', expect.any(Number))
      expect(stausReponse).toHaveProperty('type', 'documentAddition')
      expect(stausReponse).toHaveProperty('details')
      expect(stausReponse.details).toHaveProperty('indexedDocuments', 7)
      expect(stausReponse.details).toHaveProperty('receivedDocuments', 7)
      expect(stausReponse).toHaveProperty('duration', expect.any(String))
      expect(stausReponse).toHaveProperty('enqueuedAt', expect.any(String))
      expect(stausReponse).toHaveProperty('finishedAt', expect.any(String))
      expect(stausReponse).toHaveProperty('startedAt', expect.any(String))
    })

    test(`${permission} key: Get one update`, async () => {
      const client = await getClient(permission)
      const response: EnqueuedTask = await client
        .index(index.uid)
        .addDocuments(dataset)
      expect(response).toHaveProperty('uid', expect.any(Number))
      await client.waitForTask(response.uid)

      const stausReponse: Task = await client
        .index(index.uid)
        .getTask(response.uid)

      expect(stausReponse).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
      expect(stausReponse).toHaveProperty('uid', expect.any(Number))
      expect(stausReponse).toHaveProperty('type', 'documentAddition')
      expect(stausReponse).toHaveProperty('details')
      expect(stausReponse.details).toHaveProperty('indexedDocuments', 7)
      expect(stausReponse.details).toHaveProperty('receivedDocuments', 7)
      expect(stausReponse).toHaveProperty('duration', expect.any(String))
      expect(stausReponse).toHaveProperty('enqueuedAt', expect.any(String))
      expect(stausReponse).toHaveProperty('finishedAt', expect.any(String))
      expect(stausReponse).toHaveProperty('startedAt', expect.any(String))
    })

    test(`${permission} key: Get all updates`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.index(index.uid).addDocuments([{ id: 1 }])
      await client.waitForTask(uid)

      const response = await client.index(index.uid).getTasks()

      expect(response.results[0]).toHaveProperty(
        'status',
        TaskStatus.TASK_SUCCEEDED
      )
      expect(response.results[0]).toHaveProperty('uid', expect.any(Number))
      expect(response.results[0].type).toEqual('documentAddition')
      expect(response.results[0]).toHaveProperty('duration', expect.any(String))
      expect(response.results[0]).toHaveProperty(
        'enqueuedAt',
        expect.any(String)
      )
      expect(response.results[0]).toHaveProperty(
        'finishedAt',
        expect.any(String)
      )
      expect(response.results[0]).toHaveProperty(
        'startedAt',
        expect.any(String)
      )
    })

    test(`${permission} key: Try to get update that does not exist`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getTask(2545)
      ).rejects.toHaveProperty('code', ErrorStatusCode.TASK_NOT_FOUND)
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on updates',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: Try to get a update and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.index(index.uid).getTask(0)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })
  }
)

describe.each([{ permission: 'No' }])('Test on updates', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })

  test(`${permission} key: Try to get an update and be denied`, async () => {
    const client = await getClient(permission)
    await expect(client.index(index.uid).getTask(0)).rejects.toHaveProperty(
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
  test(`Test getUpdateStatus route`, async () => {
    const route = `indexes/${index.uid}/tasks/1`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getTask(1)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getAllUpdateStatus route`, async () => {
    const route = `indexes/${index.uid}/tasks`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getTasks()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
