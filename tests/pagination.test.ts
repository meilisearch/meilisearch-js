import {
  clearAllIndexes,
  config,
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
  'Test on pagination',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('Master')
      const { taskUid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Get default pagination settings`, async () => {
      const client = await getClient(permission)
      const response: object = await client.index(index.uid).getPagination()

      expect(response).toEqual({ maxTotalHits: 1000 })
    })

    test(`${permission} key: Update pagination`, async () => {
      const client = await getClient(permission)
      const newPagination = {
        maxTotalHits: 100,
      }
      const task = await client.index(index.uid).updatePagination(newPagination)
      await client.waitForTask(task.taskUid)

      const response: object = await client.index(index.uid).getPagination()

      expect(response).toEqual(newPagination)
    })

    test(`${permission} key: Reset pagination`, async () => {
      const client = await getClient(permission)
      const newPagination = {
        maxTotalHits: 100,
      }
      const Updatetask = await client
        .index(index.uid)
        .updatePagination(newPagination)
      await client.waitForTask(Updatetask.taskUid)

      const task = await client.index(index.uid).resetPagination()
      await client.waitForTask(task.taskUid)

      const response: object = await client.index(index.uid).getPagination()

      expect(response).toEqual({ maxTotalHits: 1000 })
    })
  }
)
