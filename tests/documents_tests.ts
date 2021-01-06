import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  badHostClient,
  BAD_HOST,
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

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on documents', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(uidNoPrimaryKey.uid)
    await masterClient.createIndex(uidAndPrimaryKey.uid, {
      primaryKey: uidAndPrimaryKey.primaryKey,
    })
  })
  test(`${permission} key: Add documents to uid with NO primary key`, async () => {
    const { updateId } = await client
      .index(uidNoPrimaryKey.uid)
      .addDocuments(dataset)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Add documents to uid with primary key`, async () => {
    const { updateId } = await client
      .index(uidAndPrimaryKey.uid)
      .addDocuments(dataset)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get documents with string attributesToRetrieve`, async () => {
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocuments({
        attributesToRetrieve: 'id',
      })
      .then((response) => {
        expect(response.find((x) => Object.keys(x).length !== 1)).toEqual(
          undefined
        )
      })
  })

  test(`${permission} key: Get documents with array attributesToRetrieve`, async () => {
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocuments({
        attributesToRetrieve: ['id'],
      })
      .then((response) => {
        expect(response.find((x) => Object.keys(x).length !== 1)).toEqual(
          undefined
        )
      })
  })

  test(`${permission} key: Get documents from index that has no primary key`, async () => {
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocuments({
        attributesToRetrieve: 'id',
      })
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })
  test(`${permission} key: Get documents from index that has a primary key`, async () => {
    await client
      .index(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })

  test(`${permission} key: Replace documents from index that has NO primary key`, async () => {
    const id = 2
    const title = 'The Red And The Black'
    const { updateId } = await client
      .index(uidNoPrimaryKey.uid)
      .addDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidNoPrimaryKey.uid)
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
      .index(uidAndPrimaryKey.uid)
      .addDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidAndPrimaryKey.uid)
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
      .index(uidNoPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidNoPrimaryKey.uid)
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
      .index(uidAndPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidAndPrimaryKey.uid)
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
      .index(uidNoPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length + 1)
      })
  })
  test(`${permission} key: Add document with update documents function from index that has a primary key`, async () => {
    const id = 9
    const title = '1984'
    const { updateId } = await client
      .index(uidAndPrimaryKey.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidAndPrimaryKey.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
    await client
      .index(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length + 1)
      })
  })
  test(`${permission} key: Delete a document from index that has NO primary key`, async () => {
    const id = 9
    const { updateId } = await client
      .index(uidNoPrimaryKey.uid)
      .deleteDocument(id)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })
  test(`${permission} key: Delete a document from index that has a primary key`, async () => {
    const id = 9
    const { updateId } = await client
      .index(uidAndPrimaryKey.uid)
      .deleteDocument(id)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })

  test(`${permission} key: Delete some documents from index that has NO primary key`, async () => {
    const ids = [1, 2]
    const { updateId } = await client
      .index(uidNoPrimaryKey.uid)
      .deleteDocuments(ids)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length - 2)
        const returnedIds = response.map((x) => x.id)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })
  })
  test(`${permission} key: Delete some documents from index that has a primary key`, async () => {
    const ids = [1, 2]
    const { updateId } = await client
      .index(uidAndPrimaryKey.uid)
      .deleteDocuments(ids)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length - 2)
        const returnedIds = response.map((x) => x.id)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })
  })
  test(`${permission} key: Delete all document from index that has NO primary key`, async () => {
    const { updateId } = await client
      .index(uidNoPrimaryKey.uid)
      .deleteAllDocuments()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidNoPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(0)
      })
  })
  test(`${permission} key: Delete all document from index that has a primary key`, async () => {
    const { updateId } = await client
      .index(uidAndPrimaryKey.uid)
      .deleteAllDocuments()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidAndPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidAndPrimaryKey.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(0)
      })
  })
  test(`${permission} key: Try to get deleted document from index that has NO primary key`, async () => {
    await expect(
      client.index(uidNoPrimaryKey.uid).getDocument(1)
    ).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.DOCUMENT_NOT_FOUND
    )
  })
  test(`${permission} key: Try to get deleted document from index that has a primary key`, async () => {
    await expect(
      client.index(uidAndPrimaryKey.uid).getDocument(1)
    ).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.DOCUMENT_NOT_FOUND
    )
  })
  test(`${permission} key: Add documents from index with no primary key by giving a primary key as parameter`, async () => {
    const docs = [
      {
        id: 1,
        unique: 2,
        title: 'Le Rouge et le Noir',
      },
    ]

    await client.createIndex('updateUid').then((response) => {
      expect(response).toHaveProperty('uid', 'updateUid')
    })
    const { updateId } = await client
      .index('updateUid')
      .addDocuments(docs, { primaryKey: 'unique' })
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index('updateUid').waitForPendingUpdate(updateId)
    await client
      .index('updateUid')
      .getRawInfo()
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
      .index(uidNoPrimaryKey.uid)
      .addDocuments(docs)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(uidNoPrimaryKey.uid).waitForPendingUpdate(updateId)
    await client
      .index(uidNoPrimaryKey.uid)
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
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
    test(`${permission} key: Try to update documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
    test(`${permission} key: Try to get documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
    test(`${permission} key: Try to delete one document and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
    test(`${permission} key: Try to delete some documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
    test(`${permission} key: Try to delete all documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on documents',
  ({ client, permission }) => {
    test(`${permission} key: Try to add documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: Try to update documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: Try to get documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: Try to delete one document and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: Try to delete some documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: Try to delete all documents and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

test(`Get request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(uidNoPrimaryKey.uid).getDocuments()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes/movies_test/documents`)
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/movies_test/documents/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Get request with options should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient
      .index(uidNoPrimaryKey.uid)
      .getDocuments({ attributesToRetrieve: ['id'] })
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/documents?attributesToRetrieve=id`
    )
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/movies_test/documents/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Update request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient
      .index(uidNoPrimaryKey.uid)
      .updateDocuments([])
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes/movies_test/documents`)
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/movies_test/documents/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Delete batch request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient
      .index(uidNoPrimaryKey.uid)
      .deleteDocuments([])
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(
      `${BAD_HOST}/indexes/movies_test/documents/delete-batch`
    )
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/documents/delete-batch/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Delete all request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient
      .index(uidNoPrimaryKey.uid)
      .deleteAllDocuments()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes/movies_test/documents`)
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/movies_test/documents/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Delete one request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(uidNoPrimaryKey.uid).deleteDocument(1)
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes/movies_test/documents/1`)
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/documents/1/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Get one request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.index(uidNoPrimaryKey.uid).getDocument(1)
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes/movies_test/documents/1`)
    expect(e.message).not.toMatch(
      `${BAD_HOST}/indexes/movies_test/documents/1/`
    )
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
