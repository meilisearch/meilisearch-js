import { ErrorStatusCode, TaskTypes, TaskStatus } from '../src/types'
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
  'Tests on tasks',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { taskUid } = await client.createIndex(index.uid)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Get one enqueued task`, async () => {
      const client = await getClient(permission)

      const enqueuedTask = await client.index(index.uid).addDocuments(dataset)

      expect(enqueuedTask.taskUid).toBeDefined()
      expect(enqueuedTask.indexUid).toEqual(index.uid)
      expect(enqueuedTask.status).toBeDefined()
      expect(enqueuedTask.type).toEqual(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
      expect(enqueuedTask.enqueuedAt).toBeDefined()
    })

    test(`${permission} key: Get one task`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(enqueuedTask.taskUid)

      const task = await client.getTask(enqueuedTask.taskUid)

      expect(task.indexUid).toEqual(index.uid)
      expect(task.status).toEqual(TaskStatus.TASK_SUCCEEDED)
      expect(task.type).toEqual(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
      expect(task.enqueuedAt).toBeDefined()
      expect(task.uid).toEqual(enqueuedTask.taskUid)
      expect(task).toHaveProperty('details')
      expect(task.details.indexedDocuments).toEqual(7)
      expect(task.details.receivedDocuments).toEqual(7)
      expect(task.duration).toBeDefined()
      expect(task.enqueuedAt).toBeDefined()
      expect(task.finishedAt).toBeDefined()
      expect(task.startedAt).toBeDefined()
    })

    test(`${permission} key: Get one task with index instance`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(enqueuedTask.taskUid)

      const task = await client.index(index.uid).getTask(enqueuedTask.taskUid)

      expect(task.indexUid).toEqual(index.uid)
      expect(task.status).toEqual(TaskStatus.TASK_SUCCEEDED)
      expect(task.type).toEqual(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
      expect(task.enqueuedAt).toBeDefined()
      expect(task.uid).toEqual(enqueuedTask.taskUid)
      expect(task).toHaveProperty('details')
      expect(task.details.indexedDocuments).toEqual(7)
      expect(task.details.receivedDocuments).toEqual(7)
      expect(task.duration).toBeDefined()
      expect(task.enqueuedAt).toBeDefined()
      expect(task.finishedAt).toBeDefined()
      expect(task.startedAt).toBeDefined()
    })

    test(`${permission} key: Get all tasks`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
      await client.waitForTask(enqueuedTask.taskUid)

      const tasks = await client.getTasks()

      expect(tasks.results[0]).toHaveProperty(
        'status',
        TaskStatus.TASK_SUCCEEDED
      )
      expect(tasks.results[0].indexUid).toEqual(index.uid)
      expect(tasks.results[0].status).toEqual(TaskStatus.TASK_SUCCEEDED)
      expect(tasks.results[0].type).toEqual(
        TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE
      )
      expect(tasks.results[0].enqueuedAt).toBeDefined()
      expect(tasks.results[0].uid).toBeDefined()
      expect(tasks.results[0].type).toEqual(
        TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE
      )
      expect(tasks.results[0].duration).toBeDefined()
      expect(tasks.results[0].finishedAt).toBeDefined()
      expect(tasks.results[0].startedAt).toBeDefined()
    })

    test(`${permission} key: Get all indexes tasks with query parameters`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
      await client.waitForTask(enqueuedTask.taskUid)

      const tasks = await client.getTasks({ indexUid: index.uid })

      expect(tasks.results[0]).toHaveProperty(
        'status',
        TaskStatus.TASK_SUCCEEDED
      )
      expect(tasks.results[0].indexUid).toEqual(index.uid)
      expect(tasks.results[0].status).toEqual(TaskStatus.TASK_SUCCEEDED)
      expect(tasks.results[0].type).toEqual(
        TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE
      )
      expect(tasks.results[0].enqueuedAt).toBeDefined()
      expect(tasks.results[0].uid).toBeDefined()
      expect(tasks.results[0].type).toEqual(
        TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE
      )
      expect(tasks.results[0].duration).toBeDefined()
      expect(tasks.results[0].finishedAt).toBeDefined()
      expect(tasks.results[0].startedAt).toBeDefined()
    })

    test(`${permission} key: Get all indexes tasks with index instance`, async () => {
      const client = await getClient(permission)
      const enqueuedTask = await client
        .index(index.uid)
        .addDocuments([{ id: 1 }])
      await client.waitForTask(enqueuedTask.taskUid)

      const tasks = await client.index(index.uid).getTasks()

      expect(tasks.results[0]).toHaveProperty(
        'status',
        TaskStatus.TASK_SUCCEEDED
      )
      expect(tasks.results[0].indexUid).toEqual(index.uid)
      expect(tasks.results[0].status).toEqual(TaskStatus.TASK_SUCCEEDED)
      expect(tasks.results[0].type).toEqual(
        TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE
      )
      expect(tasks.results[0].enqueuedAt).toBeDefined()
      expect(tasks.results[0].uid).toBeDefined()
      expect(tasks.results[0].type).toEqual(
        TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE
      )
      expect(tasks.results[0].duration).toBeDefined()
      expect(tasks.results[0].finishedAt).toBeDefined()
      expect(tasks.results[0].startedAt).toBeDefined()
    })

    test(`${permission} key: Try to get a task that does not exist`, async () => {
      const client = await getClient(permission)

      await expect(client.getTask(254500)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.TASK_NOT_FOUND
      )
    })
  }
)

describe.each([{ permission: 'Public' }])('Test on tasks', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })

  test(`${permission} key: Try to get a task and be denied`, async () => {
    const client = await getClient(permission)
    await expect(client.getTask(0)).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.INVALID_API_KEY
    )
  })
})

describe.each([{ permission: 'No' }])('Test on tasks', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })

  test(`${permission} key: Try to get an task and be denied`, async () => {
    const client = await getClient(permission)
    await expect(client.getTask(0)).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })
})

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on task url construction', ({ host, trailing }) => {
  test(`Test on getTask route`, async () => {
    const route = `tasks/1`
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

  test(`Test on getTasks route`, async () => {
    const route = `tasks?indexUid=movies_test`
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
