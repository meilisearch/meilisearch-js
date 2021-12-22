import { ErrorStatusCode, EnqueuedTask, IndexResponse } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
} from './meilisearch-test-utils'

const indexNoPk = {
  uid: 'movies_test',
}
const indexPk = {
  uid: 'movies_test2',
  primaryKey: 'id',
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

describe('Documents tests', () => {
  describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
    'Test on documents',
    ({ permission }) => {
      beforeEach(async () => {
        await clearAllIndexes(config)
        const client = await getClient('Master')

        const { uid: taskCreateNoPk } = await client.createIndex(indexNoPk.uid)
        await client.waitForTask(taskCreateNoPk)

        const { uid: taskCreateWithPk } = await client.createIndex(
          indexPk.uid,
          {
            primaryKey: indexPk.primaryKey,
          }
        )
        await client.waitForTask(taskCreateWithPk)
      })

      test(`${permission} key: Add documents to uid with NO primary key`, async () => {
        const client = await getClient(permission)
        const response = await client.index(indexNoPk.uid).addDocuments(dataset)
        expect(response).toHaveProperty('uid', expect.any(Number))
        await client.index(indexNoPk.uid).waitForTask(response.uid)
      })

      test(`${permission} key: Add documents to uid with primary key`, async () => {
        const client = await getClient(permission)
        const response = await client.index(indexPk.uid).addDocuments(dataset)
        expect(response).toHaveProperty('uid', expect.any(Number))
        await client.index(indexPk.uid).waitForTask(response.uid)
      })

      test(`${permission} key: Add documents to uid with primary key in batch`, async () => {
        const client = await getClient(permission)
        const tasks = await client
          .index(indexPk.uid)
          .addDocumentsInBatches(dataset, 4)

        expect(tasks).toBeInstanceOf(Array)
        expect(tasks).toHaveLength(2)
        expect(tasks[0]).toHaveProperty('uid', expect.any(Number))
        for (const task of tasks) {
          const { type, status } = await client.waitForTask(task.uid)
          expect(status).toBe('succeeded')
          expect(type).toBe('documentAddition')
        }
      })

      test(`${permission} key: Get documents with string attributesToRetrieve`, async () => {
        const client = await getClient(permission)
        const response = await client.index(indexNoPk.uid).getDocuments({
          attributesToRetrieve: 'id',
        })
        expect(response.find((x) => Object.keys(x).length !== 1)).toEqual(
          undefined
        )
      })

      test(`${permission} key: Get documents with array attributesToRetrieve`, async () => {
        const client = await getClient(permission)
        const response = await client.index(indexNoPk.uid).getDocuments({
          attributesToRetrieve: ['id'],
        })
        expect(response.find((x) => Object.keys(x).length !== 1)).toEqual(
          undefined
        )
      })

      test(`${permission} key: Get documents from index that has no primary key`, async () => {
        const client = await getClient(permission)
        const { uid } = await client.index(indexNoPk.uid).addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(uid)

        const response = await client.index(indexNoPk.uid).getDocuments({
          attributesToRetrieve: 'id',
        })
        expect(response.length).toEqual(dataset.length)
      })

      test(`${permission} key: Get documents from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { uid } = await client.index(indexPk.uid).addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(uid)

        const response = await client.index(indexPk.uid).getDocuments()
        expect(response.length).toEqual(dataset.length)
      })

      test(`${permission} key: Replace documents from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { uid: addDocUpdate } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocUpdate)

        const id = 2
        const title = 'The Red And The Black'
        const documents: EnqueuedTask = await client
          .index(indexNoPk.uid)
          .addDocuments([{ id, title }])
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexNoPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexNoPk.uid).getDocument(id)
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Replace documents from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const id = 2
        const title = 'The Red And The Black'
        const documents: EnqueuedTask = await client
          .index(indexPk.uid)
          .addDocuments([{ id, title }])
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexPk.uid).getDocument(id)
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Update document from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const id = 456
        const title = 'The Little Prince'

        const documents: EnqueuedTask = await client
          .index(indexNoPk.uid)
          .updateDocuments([{ id, title }])
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexNoPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexNoPk.uid).getDocument(id)
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Update document from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const id = 456
        const title = 'The Little Prince'
        const documents: EnqueuedTask = await client
          .index(indexPk.uid)
          .updateDocuments([{ id, title }])
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexPk.uid).getDocument(id)
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })

      test(`${permission} key: Update document from index that has a primary key in batch`, async () => {
        const client = await getClient(permission)
        const tasks = await client
          .index(indexPk.uid)
          .updateDocumentsInBatches(dataset, 2)
        expect(tasks).toBeInstanceOf(Array)
        expect(tasks).toHaveLength(4)
        expect(tasks[0]).toHaveProperty('uid', expect.any(Number))
        for (const EnqueuedTask of tasks) {
          const task = await client
            .index(indexPk.uid)
            .waitForTask(EnqueuedTask.uid)
          expect(task.status).toBe('succeeded')
          expect(task.type).toBe('documentPartial')
        }
      })

      test(`${permission} key: Add document with update documents function from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { uid: addDocUpdate } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocUpdate)

        const id = 9
        const title = '1984'

        const documents: EnqueuedTask = await client
          .index(indexNoPk.uid)
          .updateDocuments([{ id, title }])
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexNoPk.uid).waitForTask(documents.uid)

        const document = await client.index(indexNoPk.uid).getDocument(id)
        expect(document).toHaveProperty('id', id)
        expect(document).toHaveProperty('title', title)

        const response = await client.index(indexNoPk.uid).getDocuments()
        expect(response.length).toEqual(dataset.length + 1)
      })

      test(`${permission} key: Add document with update documents function from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { uid: addDocUpdate } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(addDocUpdate)

        const id = 9
        const title = '1984'
        const documents: EnqueuedTask = await client
          .index(indexPk.uid)
          .updateDocuments([{ id, title }])
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexPk.uid).waitForTask(documents.uid)

        const document = await client.index(indexPk.uid).getDocument(id)
        expect(document).toHaveProperty('id', id)
        expect(document).toHaveProperty('title', title)

        const response = await client.index(indexPk.uid).getDocuments()
        expect(response.length).toEqual(dataset.length + 1)
      })

      test(`${permission} key: Delete a document from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { uid: addDocUpdate } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocUpdate)

        const id = 9

        const document: EnqueuedTask = await client
          .index(indexNoPk.uid)
          .deleteDocument(id)
        expect(document).toHaveProperty('uid', expect.any(Number))
        await client.index(indexNoPk.uid).waitForTask(document.uid)

        const response = await client.index(indexNoPk.uid).getDocuments()
        expect(response.length).toEqual(dataset.length)
      })

      test(`${permission} key: Delete a document from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { uid: addDocUpdate } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(addDocUpdate)

        const id = 9
        const document: EnqueuedTask = await client
          .index(indexPk.uid)
          .deleteDocument(id)
        expect(document).toHaveProperty('uid', expect.any(Number))
        await client.index(indexPk.uid).waitForTask(document.uid)

        const response = await client.index(indexPk.uid).getDocuments()
        expect(response.length).toEqual(dataset.length)
      })

      test(`${permission} key: Delete some documents from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const { uid: addDocUpdate } = await client
          .index(indexNoPk.uid)
          .addDocuments(dataset)
        await client.index(indexNoPk.uid).waitForTask(addDocUpdate)

        const ids = [1, 2]

        const documents: EnqueuedTask = await client
          .index(indexNoPk.uid)
          .deleteDocuments(ids)
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexNoPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexNoPk.uid).getDocuments()
        expect(response.length).toEqual(dataset.length - 2)
        const returnedIds = response.map((x) => x.id)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })

      test(`${permission} key: Delete some documents from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const { uid: addDocUpdate } = await client
          .index(indexPk.uid)
          .addDocuments(dataset)
        await client.index(indexPk.uid).waitForTask(addDocUpdate)

        const ids = [1, 2]
        const documents: EnqueuedTask = await client
          .index(indexPk.uid)
          .deleteDocuments(ids)
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexPk.uid).getDocuments()
        expect(response.length).toEqual(dataset.length - 2)
        const returnedIds = response.map((x) => x.id)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })

      test(`${permission} key: Delete all document from index that has NO primary key`, async () => {
        const client = await getClient(permission)
        const documents: EnqueuedTask = await client
          .index(indexNoPk.uid)
          .deleteAllDocuments()
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexNoPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexNoPk.uid).getDocuments()
        expect(response.length).toEqual(0)
      })

      test(`${permission} key: Delete all document from index that has a primary key`, async () => {
        const client = await getClient(permission)
        const documents: EnqueuedTask = await client
          .index(indexPk.uid)
          .deleteAllDocuments()
        expect(documents).toHaveProperty('uid', expect.any(Number))
        await client.index(indexPk.uid).waitForTask(documents.uid)

        const response = await client.index(indexPk.uid).getDocuments()
        expect(response.length).toEqual(0)
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
        const { uid } = await client.createIndex(pkIndex)
        await client.waitForTask(uid)

        const index = await client.getIndex(pkIndex)
        expect(index).toHaveProperty('uid', pkIndex)

        const task: EnqueuedTask = await client
          .index(pkIndex)
          .addDocuments(docs, { primaryKey: 'unique' })

        expect(task).toHaveProperty('uid', expect.any(Number))

        await client.waitForTask(task.uid)

        const response: IndexResponse = await client.index(pkIndex).getRawInfo()
        expect(response).toHaveProperty('uid', pkIndex)
        expect(response).toHaveProperty('primaryKey', 'unique')
      })

      test(`${permission} key: Add a document without a primary key and check response in update status`, async () => {
        const client = await getClient(permission)
        const docs = [
          {
            title: 'Le Rouge et le Noir',
          },
        ]
        const { uid } = await client.index(indexNoPk.uid).addDocuments(docs)
        const { error } = await client.waitForTask(uid)
        expect(error).toHaveProperty('code')
        expect(error).toHaveProperty('link')
        expect(error).toHaveProperty('message')
        expect(error).toHaveProperty('type')
      })

      test(`${permission} key: Try to add documents from index with no primary key with NO valid primary key, update should fail`, async () => {
        const client = await getClient(permission)
        const { uid } = await client.index(indexNoPk.uid).addDocuments([
          {
            unique: 2,
            title: 'Le Rouge et le Noir',
          },
        ])

        const task = await client.waitForTask(uid)

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
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: Try to update documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: Try to get documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: Try to delete one document and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: Try to delete some documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: Try to delete all documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
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

        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to update documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to get documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to delete one document and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to delete some documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: Try to delete all documents and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
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
        client.index(indexPk.uid).getDocuments()
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
