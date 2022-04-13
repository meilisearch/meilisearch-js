import { TaskStatus } from '../src'
import {
  clearAllIndexes,
  config,
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
  'Test on wait for task',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      const { uid } = await client.createIndex(index.uid)
      await client.waitForTask(uid)
    })

    // Client Wait for tasks
    test(`${permission} key: Tests wait for task in client until done and resolved`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      const update = await client.waitForTask(uid)
      expect(update).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
    })

    test(`${permission} key: Tests wait for task in client with custom interval and timeout until done and resolved`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      const update = await client.waitForTask(uid, {
        timeOutMs: 6000,
        intervalMs: 100,
      })
      expect(update).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
    })

    test(`${permission} key: Tests wait for task in client with custom timeout and interval at 0 done and resolved`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      const update = await client.waitForTask(uid, {
        timeOutMs: 6000,
        intervalMs: 0,
      })
      expect(update).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
    })

    test(`${permission} key: Try to wait for task in client with small timeout and raise an error`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.index(index.uid).addDocuments(dataset)
      await expect(
        client.waitForTask(uid, { timeOutMs: 0 })
      ).rejects.toHaveProperty('name', 'MeiliSearchTimeOutError')
    })

    // Client Wait for tasks

    test(`${permission} key: Tests wait for tasks in client until done and resolved`, async () => {
      const client = await getClient(permission)
      const { uid: task1 } = await client.index(index.uid).addDocuments(dataset)
      const { uid: task2 } = await client
        .index(index.uid)
        .updateSettings({ searchableAttributes: [] })
      const update = await client.waitForTasks([task1, task2])
      const [update1, update2] = update.results
      expect(update1).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
      expect(update2).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
    })

    test(`${permission} key: Tests wait for tasks in client with custom interval and timeout until done and resolved`, async () => {
      const client = await getClient(permission)
      const { uid: task1 } = await client.index(index.uid).addDocuments(dataset)
      const { uid: task2 } = await client
        .index(index.uid)
        .updateSettings({ searchableAttributes: [] })
      const update = await client.waitForTasks([task1, task2], {
        timeOutMs: 6000,
        intervalMs: 100,
      })
      const [update1, update2] = update.results
      expect(update1).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
      expect(update2).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
    })

    test(`${permission} key: Tests wait for tasks in client with custom timeout and interval at 0 done and resolved`, async () => {
      const client = await getClient(permission)
      const { uid: task1 } = await client.index(index.uid).addDocuments(dataset)
      const { uid: task2 } = await client
        .index(index.uid)
        .updateSettings({ searchableAttributes: [] })
      const update = await client.waitForTasks([task1, task2], {
        timeOutMs: 6000,
        intervalMs: 0,
      })
      const [update1, update2] = update.results
      expect(update1).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
      expect(update2).toHaveProperty('status', TaskStatus.TASK_SUCCEEDED)
    })

    test(`${permission} key: Tests to wait for tasks in client with small timeout and raise an error`, async () => {
      const client = await getClient(permission)
      const { uid: task1 } = await client.index(index.uid).addDocuments(dataset)
      const { uid: task2 } = await client
        .index(index.uid)
        .updateSettings({ searchableAttributes: [] })
      await expect(
        client.waitForTasks([task1, task2], { timeOutMs: 0 })
      ).rejects.toHaveProperty('name', 'MeiliSearchTimeOutError')
    })
  }
)
