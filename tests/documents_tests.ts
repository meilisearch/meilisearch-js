import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  PUBLIC_KEY,
} from './meilisearch-test-utils'

const uidNoPrimaryKey = {
  uid: 'movies_test',
}
const uidAndPrimaryKey = {
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

beforeAll(async () => {
  await clearAllIndexes(config)
  await masterClient.createIndex(uidNoPrimaryKey)
  await masterClient.createIndex(uidAndPrimaryKey)
})

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on documents', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(uidNoPrimaryKey)
    await masterClient.createIndex(uidAndPrimaryKey)
  })
  test(`${permission} key: Add documents to uid with NO primary key`, async () => {
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .addDocuments(dataset)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Add documents to uid with primary key`, async () => {
    const { updateId } = await client
      .getIndex(uidAndPrimaryKey.uid)
      .addDocuments(dataset)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get documents from index that has no primary key`, async () => {
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })
  test(`${permission} key: Get documents from index that has a primary key`, async () => {
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })
  test(`${permission} key: Replace documents from index that has NO primary key`, async () => {
    const id = 2
    const title = 'The Red And The Black'
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .addDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
  })
  test(`${permission} key: Replace documents from index that has a primary key`, async () => {
    const id = 2
    const title = 'The Red And The Black'
    const { updateId } = await client
      .getIndex(uidAndPrimaryKey.uid)
      .addDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
  })

  test(`${permission} key: Update document from index that has NO primary key`, async () => {
    const id = 456
    const title = 'The Little Prince'
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
  })
  test(`${permission} key: Update document from index that has a primary key`, async () => {
    const id = 456
    const title = 'The Little Prince'
    const { updateId } = await client
      .getIndex(uidAndPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
  })

  test(`${permission} key: Add document with update documents function from index that has NO primary key`, async () => {
    const id = 9
    const title = '1984'
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length + 1)
      })
  })
  test(`${permission} key: Add document with update documents function from index that has a primary key`, async () => {
    const id = 9
    const title = '1984'
    const { updateId } = await client
      .getIndex(uidAndPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length + 1)
      })
  })
  test(`${permission} key: Delete a document from index that has NO primary key`, async () => {
    const id = 9
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .deleteDocument(id)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })
  test(`${permission} key: Delete a document from index that has a primary key`, async () => {
    const id = 9
    const { updateId } = await client
      .getIndex(uidAndPrimaryKey.uid)
      .deleteDocument(id)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })

  test(`${permission} key: Delete some documents from index that has NO primary key`, async () => {
    const ids = [1, 2]
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .deleteDocuments(ids)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length - 2)
        const returnedIds = response.map((x: Types.Document) => x.id)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })
  })
  test(`${permission} key: Delete some documents from index that has a primary key`, async () => {
    const ids = [1, 2]
    const { updateId } = await client
      .getIndex(uidAndPrimaryKey.uid)
      .deleteDocuments(ids)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length - 2)
        const returnedIds = response.map((x: Types.Document) => x.id)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })
  })
  test(`${permission} key: Delete all document from index that has NO primary key`, async () => {
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .deleteAllDocuments()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(0)
      })
  })
  test(`${permission} key: Delete all document from index that has a primary key`, async () => {
    const { updateId } = await client
      .getIndex(uidAndPrimaryKey.uid)
      .deleteAllDocuments()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(0)
      })
  })
  test(`${permission} key: Try to get deleted document from index that has NO primary key`, async () => {
    await expect(
      client.getIndex(uidNoPrimaryKey.uid).getDocument(1)
    ).rejects.toThrowError('Document with id 1 not found')
  })
  test(`${permission} key: Try to get deleted document from index that has a primary key`, async () => {
    await expect(
      client.getIndex(uidAndPrimaryKey.uid).getDocument(1)
    ).rejects.toThrowError('Document with id 1 not found')
  })
  test(`${permission} key: Add documents from index with no primary key by giving a primary key as parameter`, async () => {
    const docs = [
      {
        id: 1,
        unique: 2,
        title: 'Le Rouge et le Noir',
      },
    ]

    await client.createIndex({ uid: 'updateUid' }).then((response) => {
      expect(response).toHaveProperty('uid', 'updateUid')
    })
    const { updateId } = await client
      .getIndex('updateUid')
      .addDocuments(docs, { primaryKey: 'unique' })
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex('updateUid').waitForPendingUpdate(updateId)
    await client
      .getIndex('updateUid')
      .show()
      .then((response: Types.IndexResponse) => {
        expect(response).toHaveProperty('uid', 'updateUid')
        expect(response).toHaveProperty('primaryKey', 'unique')
      })
  })
  test(`${permission} key: Try to add documents from index with no primary key with NO valid primary key and fail`, async () => {
    const docs = [
      {
        unique: 2,
        title: 'Le Rouge et le Noir',
      },
    ]
    const { updateId } = await client
      .getIndex(uidNoPrimaryKey.uid)
      .addDocuments(docs)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(uidNoPrimaryKey.uid)
      .getAllUpdateStatus()
      .then((response: Types.Update[]) => {
        const lastUpdate = response[response.length - 1]
        expect(lastUpdate).toHaveProperty('error', 'document id is missing')
        expect(lastUpdate).toHaveProperty('status', 'failed')
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on documents',
  ({ client, permission }) => {
    test(`${permission} key: Try to add documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: ${PUBLIC_KEY}`
      )
    })
    test(`${permission} key: Try to update documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: ${PUBLIC_KEY}`
      )
    })
    test(`${permission} key: Try to get documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: ${PUBLIC_KEY}`
      )
    })
    test(`${permission} key: Try to delete one document and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: ${PUBLIC_KEY}`
      )
    })
    test(`${permission} key: Try to delete some documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: ${PUBLIC_KEY}`
      )
    })
    test(`${permission} key: Try to delete all documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: ${PUBLIC_KEY}`
      )
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on documents',
  ({ client, permission }) => {
    test(`${permission} key: Try to add documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: Need a token`
      )
    })
    test(`${permission} key: Try to update documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: Need a token`
      )
    })
    test(`${permission} key: Try to get documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: Need a token`
      )
    })
    test(`${permission} key: Try to delete one document and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: Need a token`
      )
    })
    test(`${permission} key: Try to delete some documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: Need a token`
      )
    })
    test(`${permission} key: Try to delete all documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toThrowError(
        `Invalid API key: Need a token`
      )
    })
  }
)
