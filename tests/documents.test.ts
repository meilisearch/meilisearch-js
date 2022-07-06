import { ErrorStatusCode, TaskStatus, TaskTypes } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
  Book,
} from './utils/meilisearch-test-utils'

const indexNoPk = {
  uid: 'movies_test',
}
const indexPk = {
  uid: 'movies_test2',
  primaryKey: 'id',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe('Documents tests', () => {
  describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
    'Test on documents',
    ({ permission }) => {
      beforeEach(async () => {
        await clearAllIndexes(config)
        const client = await getClient('Master')
        const { taskUid: taskCreateNoPk } = await client.createIndex(
          indexNoPk.uid
        )
        await client.waitForTask(taskCreateNoPk)
        const { taskUid: taskCreateWithPk } = await client.createIndex(
          indexPk.uid,
          {
            primaryKey: indexPk.primaryKey,
          }
        )
        await client.waitForTask(taskCreateWithPk)
      })

      test(`${permission} key: Add documents to uid with primary key in batch`, async () => {
        const client = await getClient(permission)
        const tasks = await client
          .index(indexPk.uid)
          .addDocumentsInBatches(dataset, 4)

        expect(tasks).toHaveLength(2)
        for (const task of tasks) {
          const { type, status } = await client.waitForTask(task.taskUid)
          expect(status).toBe(TaskStatus.TASK_SUCCEEDED)
          expect(type).toBe(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
        }
      })

      test(`${permission} key: Get one document `, async () => {
        const client = await getClient(permission)
        const { taskUid } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(taskUid)

        const documentId = 1
        const document = await client
          .index(indexNoPk.uid)
          .getDocument<Book>(documentId)

        expect(document.title).toEqual('Alice In Wonderland')
      })

      test(`${permission} key: Get one document with fields parameter`, async () => {
        const client = await getClient(permission)
        const { taskUid } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(taskUid)

        const documentId = 1
        const document = await client
          .index(indexNoPk.uid)
          .getDocument<Book>(documentId, { fields: ['title'] })

        expect(document.title).toEqual('Alice In Wonderland')
        expect(document.id).toBeUndefined()
      })

      test(`${permission} key: Get documents with string fields`, async () => {
        const client = await getClient(permission)

        const documents = await client.index(indexNoPk.uid).getDocuments<Book>({
          fields: 'id',
        })

        expect(
          documents.results.find((x) => Object.keys(x).length !== 1)
        ).toBeUndefined()
      })

      test(`${permission} key: Get documents with array fields`, async () => {
        const client = await getClient(permission)
        const { taskUid } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.waitForTask(taskUid)

        const documents = await client.index(indexPk.uid).getDocuments<Book>({
          fields: ['id'],
        })
        const onlyIdFields = Array.from(
          new Set(
            documents.results.reduce<string[]>(
              (acc, document) => [...acc, ...Object.keys(document)],
              []
            )
          )
        )

        expect(onlyIdFields.length).toEqual(1)
        expect(onlyIdFields[0]).toEqual('id')
      })

      test(`${permission} key: Get documents with pagination`, async () => {
        const client = await getClient(permission)
        const { taskUid } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.waitForTask(taskUid)

        const documents = await client.index(indexPk.uid).getDocuments<Book>({
          limit: 1,
          offset: 2,
        })

        expect(documents.results.length).toEqual(1)
        expect(documents.limit).toEqual(1)
        expect(documents.offset).toEqual(2)
      })

      test(`${permission} key: Get documents from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(taskUid)

        const documents = await client.index(indexNoPk.uid).getDocuments<Book>({
          fields: 'id',
        })

        expect(documents.results.length).toEqual(dataset.length)
      })

      test(`${permission} key: Get documents from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(taskUid)

        const documents = await client.index(indexPk.uid).getDocuments<Book>()
        expect(documents.results.length).toEqual(dataset.length)
      })

      test(`${permission} key: Replace documents from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid: addDocTask } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocTask)
        const id = 2
        const title = 'The Red And The Black'

        const task = await client
          .index(indexNoPk.uid)
          .addDocuments([{ id, title }])
        await client.index(indexNoPk.uid).waitForTask(task.taskUid)
        const response = await client.index(indexNoPk.uid).getDocument(id)

        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Replace documents from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const id = 2
        const title = 'The Red And The Black'

        const task = await client
          .index(indexPk.uid)
          .addDocuments([{ id, title }])
        await client.index(indexPk.uid).waitForTask(task.taskUid)
        const response = await client.index(indexPk.uid).getDocument(id)

        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Update document from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const id = 456
        const title = 'The Little Prince'

        const task = await client
          .index(indexNoPk.uid)
          .updateDocuments([{ id, title }])
        await client.index(indexNoPk.uid).waitForTask(task.taskUid)
        const response = await client.index(indexNoPk.uid).getDocument(id)

        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Update document from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const id = 456
        const title = 'The Little Prince'
        const task = await client
          .index(indexPk.uid)
          .updateDocuments([{ id, title }])
        await client.index(indexPk.uid).waitForTask(task.taskUid)
        const response = await client.index(indexPk.uid).getDocument(id)

        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Partial update of a document`, async () => {
        const client = await getClient(permission)
        const id = 456
        const task = await client
          .index<Book>(indexPk.uid)
          .updateDocuments([{ id }])
        await client.index(indexPk.uid).waitForTask(task.taskUid)

        const response = await client.index(indexPk.uid).getDocument(id)

        expect(response).toHaveProperty('id', id)
        expect(response).not.toHaveProperty('title')
      })

      test(`${permission} key: Update document from index that has a primary key in batch`, async () => {
        const client = await getClient(permission)
        const tasks = await client
          .index(indexPk.uid)
          .updateDocumentsInBatches(dataset, 2)

        for (const EnqueuedTask of tasks) {
          const task = await client
            .index(indexPk.uid)
            .waitForTask(EnqueuedTask.taskUid)
          expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED)
          expect(task.type).toBe(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
        }
        expect(tasks).toHaveLength(4)
      })

      test(`${permission} key: Partial update of a document in batch`, async () => {
        const client = await getClient(permission)
        const partialDocument = { id: 1 }

        const tasks = await client
          .index<Book>(indexPk.uid)
          .updateDocumentsInBatches([partialDocument], 2)

        for (const EnqueuedTask of tasks) {
          const task = await client
            .index(indexPk.uid)
            .waitForTask(EnqueuedTask.taskUid)

          expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED)
          expect(task.type).toBe(TaskTypes.DOCUMENTS_ADDITION_OR_UPDATE)
        }
        expect(tasks).toHaveLength(1)
      })

      test(`${permission} key: Add document with update documents function from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid: addDocTask } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocTask)
        const id = 9
        const title = '1984'

        const task = await client
          .index(indexNoPk.uid)
          .updateDocuments([{ id, title }])
        await client.index(indexNoPk.uid).waitForTask(task.taskUid)
        const document = await client.index(indexNoPk.uid).getDocument(id)
        const documents = await client.index(indexNoPk.uid).getDocuments<Book>()

        expect(document).toHaveProperty('id', id)
        expect(document).toHaveProperty('title', title)
        expect(documents.results.length).toEqual(dataset.length + 1)
      })

      test(`${permission} key: Add document with update documents function from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid: addDocTask } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(addDocTask)
        const id = 9
        const title = '1984'
        const task = await client
          .index(indexPk.uid)
          .updateDocuments([{ id, title }])
        await client.index(indexPk.uid).waitForTask(task.taskUid)

        const document = await client.index(indexPk.uid).getDocument(id)
        const documents = await client.index(indexPk.uid).getDocuments<Book>()

        expect(document).toHaveProperty('id', id)
        expect(document).toHaveProperty('title', title)
        expect(documents.results.length).toEqual(dataset.length + 1)
      })

      test(`${permission} key: Delete a document from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid: addDocTask } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocTask)
        const id = 9

        const task = await client.index(indexNoPk.uid).deleteDocument(id)
        await client.index(indexNoPk.uid).waitForTask(task.taskUid)
        const documents = await client.index(indexNoPk.uid).getDocuments<Book>()

        expect(documents.results.length).toEqual(dataset.length)
      })

      test(`${permission} key: Delete a document from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid: addDocTask } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(addDocTask)

        const id = 9
        const task = await client.index(indexPk.uid).deleteDocument(id)
        await client.index(indexPk.uid).waitForTask(task.taskUid)
        const response = await client.index(indexPk.uid).getDocuments<Book>()

        expect(response.results.length).toEqual(dataset.length)
      })

      test(`${permission} key: Delete some documents from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid: addDocTask } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocTask)

        const ids = [1, 2]
        const task = await client.index(indexNoPk.uid).deleteDocuments(ids)
        await client.index(indexNoPk.uid).waitForTask(task.taskUid)

        const documents = await client.index(indexNoPk.uid).getDocuments<Book>()
        const returnedIds = documents.results.map((x) => x.id)

        expect(documents.results.length).toEqual(dataset.length - 2)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })

      test(`${permission} key: Delete some documents from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { taskUid: addDocTask } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(addDocTask)

        const ids = [1, 2]
        const task = await client.index(indexPk.uid).deleteDocuments(ids)
        await client.index(indexPk.uid).waitForTask(task.taskUid)
        const documents = await client.index(indexPk.uid).getDocuments<Book>()
        const returnedIds = documents.results.map((x) => x.id)

        expect(documents.results.length).toEqual(dataset.length - 2)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })

      test(`${permission} key: Delete all document from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const task = await client.index(indexNoPk.uid).deleteAllDocuments()
        await client.index(indexNoPk.uid).waitForTask(task.taskUid)

        const documents = await client.index(indexNoPk.uid).getDocuments<Book>()
        expect(documents.results.length).toEqual(0)
      })

      test(`${permission} key: Delete all document from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const task = await client.index(indexPk.uid).deleteAllDocuments()
        await client.index(indexPk.uid).waitForTask(task.taskUid)

        const documents = await client.index(indexPk.uid).getDocuments<Book>()
        expect(documents.results.length).toEqual(0)
      })

      test(`${permission} key: Try to get deleted document from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexNoPk.uid).getDocument(1)
        ).rejects.toHaveProperty('code', ErrorStatusCode.DOCUMENT_NOT_FOUND)
      })

      test(`${permission} key: Try to get deleted document from index that has a primary key`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).getDocument(1)
        ).rejects.toHaveProperty('code', ErrorStatusCode.DOCUMENT_NOT_FOUND)
      })

      test(`${permission} key: Add documents from index with no primary key by giving a primary key as parameter`, async () => {
        const client = await getClient(permission)
        const docs = [
          {
            id: 1,
            unique: 2,
            title: 'Le Rouge et le Noir',
          },
        ]
        const pkIndex = 'update_pk'
        const { taskUid } = await client.createIndex(pkIndex)
        await client.waitForTask(taskUid)

        const task = await client
          .index(pkIndex)
          .addDocuments(docs, { primaryKey: 'unique' })
        await client.waitForTask(task.taskUid)

        const response = await client.index(pkIndex).getRawInfo()
        expect(response).toHaveProperty('uid', pkIndex)
        expect(response).toHaveProperty('primaryKey', 'unique')
      })

      test(`${permission} key: Add a document without a primary key and check response in task status`, async () => {
        const client = await getClient(permission)
        const docs = [
          {
            title: 'Le Rouge et le Noir',
          },
        ]

        const { taskUid } = await client.index(indexNoPk.uid).addDocuments(docs)
        const { error } = await client.waitForTask(taskUid)

        expect(error).toHaveProperty('code')
        expect(error).toHaveProperty('link')
        expect(error).toHaveProperty('message')
        expect(error).toHaveProperty('type')
      })

      test(`${permission} key: Try to add documents from index with no primary key with NO valid primary key, task should fail`, async () => {
        const client = await getClient(permission)
        const { taskUid } = await client.index(indexNoPk.uid).addDocuments([
          {
            unique: 2,
            title: 'Le Rouge et le Noir',
          },
        ])

        const task = await client.waitForTask(taskUid)
        const index = await client.index(indexNoPk.uid).getRawInfo()

        expect(index.uid).toEqual(indexNoPk.uid)
        expect(index.primaryKey).toEqual(null)
        expect(task.status).toEqual('failed')
      })
    }
  )

  describe.each([{ permission: 'Public' }])(
    'Test on documents',
    ({ permission }) => {
      beforeEach(() => {
        return clearAllIndexes(config)
      })

      test(`${permission} key: Try to add documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).addDocuments([])
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })

      test(`${permission} key: Try to update documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).updateDocuments([])
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })

      test(`${permission} key: Try to get documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).getDocuments<Book>()
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })

      test(`${permission} key: Try to delete one document and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).deleteDocument(1)
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })

      test(`${permission} key: Try to delete some documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).deleteDocuments([1, 2])
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })

      test(`${permission} key: Try to delete all documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).deleteAllDocuments()
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })
    }
  )

  describe.each([{ permission: 'No' }])(
    'Test on documents',
    ({ permission }) => {
      beforeEach(() => {
        return clearAllIndexes(config)
      })

      test(`${permission} key: Try to add documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).addDocuments([])
        ).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to update documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).updateDocuments([])
        ).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to get documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).getDocuments<Book>()
        ).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to delete one document and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).deleteDocument(1)
        ).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to delete some documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).deleteDocuments([1, 2])
        ).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to delete all documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.index(indexPk.uid).deleteAllDocuments()
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
    test(`Test getDocument route`, async () => {
      const route = `indexes/${indexPk.uid}/documents/1`
      const client = new MeiliSearch({ host })
      const strippedHost = trailing ? host.slice(0, -1) : host
      await expect(
        client.index(indexPk.uid).getDocument(1)
      ).rejects.toHaveProperty(
        'message',
        `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
          'http://',
          ''
        )}`
      )
    })

    test(`Test getDocuments route`, async () => {
      const route = `indexes/${indexPk.uid}/documents`
      const client = new MeiliSearch({ host })
      const strippedHost = trailing ? host.slice(0, -1) : host
      await expect(
        client.index(indexPk.uid).getDocuments<Book>()
      ).rejects.toHaveProperty(
        'message',
        `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
          'http://',
          ''
        )}`
      )
    })

    test(`Test addDocuments route`, async () => {
      const route = `indexes/${indexPk.uid}/documents`
      const client = new MeiliSearch({ host })
      const strippedHost = trailing ? host.slice(0, -1) : host
      await expect(
        client.index(indexPk.uid).addDocuments([])
      ).rejects.toHaveProperty(
        'message',
        `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
          'http://',
          ''
        )}`
      )
    })

    test(`Test updateDocuments route`, async () => {
      const route = `indexes/${indexPk.uid}/documents`
      const client = new MeiliSearch({ host })
      const strippedHost = trailing ? host.slice(0, -1) : host
      await expect(
        client.index(indexPk.uid).updateDocuments([])
      ).rejects.toHaveProperty(
        'message',
        `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
          'http://',
          ''
        )}`
      )
    })

    test(`Test deleteDocument route`, async () => {
      const route = `indexes/${indexPk.uid}/documents/1`
      const client = new MeiliSearch({ host })
      const strippedHost = trailing ? host.slice(0, -1) : host
      await expect(
        client.index(indexPk.uid).deleteDocument('1')
      ).rejects.toHaveProperty(
        'message',
        `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
          'http://',
          ''
        )}`
      )
    })

    test(`Test deleteDocuments route`, async () => {
      const route = `indexes/${indexPk.uid}/documents/delete-batch`
      const client = new MeiliSearch({ host })
      const strippedHost = trailing ? host.slice(0, -1) : host
      await expect(
        client.index(indexPk.uid).deleteDocuments([])
      ).rejects.toHaveProperty(
        'message',
        `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
          'http://',
          ''
        )}`
      )
    })

    test(`Test deleteAllDocuments route`, async () => {
      const route = `indexes/${indexPk.uid}/documents`
      const client = new MeiliSearch({ host })
      const strippedHost = trailing ? host.slice(0, -1) : host
      await expect(
        client.index(indexPk.uid).deleteAllDocuments()
      ).rejects.toHaveProperty(
        'message',
        `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
          'http://',
          ''
        )}`
      )
    })
  })
})
