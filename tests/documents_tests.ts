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

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on documents', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(indexNoPk.uid)
    await masterClient.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
  })

  test(`${permission} key: Add documents to uid with NO primary key`, async () => {
    const { updateId } = await client
      .index(indexNoPk.uid)
      .addDocuments(dataset)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Add documents to uid with primary key`, async () => {
    const { updateId } = await client
      .index(indexPk.uid)
      .addDocuments(dataset)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get documents with string attributesToRetrieve`, async () => {
    await client
      .index(indexNoPk.uid)
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
      .index(indexNoPk.uid)
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
    const { updateId } = await client.index(indexNoPk.uid).addDocuments(dataset)
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)

    await client
      .index(indexNoPk.uid)
      .getDocuments({
        attributesToRetrieve: 'id',
      })
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })

  test(`${permission} key: Get documents from index that has a primary key`, async () => {
    const { updateId } = await client.index(indexPk.uid).addDocuments(dataset)
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)

    await client
      .index(indexPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })

  test(`${permission} key: Replace documents from index that has NO primary key`, async () => {
    const { updateId: addDocUpdate } = await client
      .index(indexNoPk.uid)
      .addDocuments(dataset)
    await client.index(indexNoPk.uid).waitForPendingUpdate(addDocUpdate)

    const id = 2
    const title = 'The Red And The Black'
    const { updateId } = await client
      .index(indexNoPk.uid)
      .addDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexNoPk.uid)
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
      .index(indexPk.uid)
      .addDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexPk.uid)
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
      .index(indexNoPk.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexNoPk.uid)
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
      .index(indexPk.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexPk.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
  })

  test(`${permission} key: Add document with update documents function from index that has NO primary key`, async () => {
    const { updateId: addDocUpdate } = await client
      .index(indexNoPk.uid)
      .addDocuments(dataset)
    await client.index(indexNoPk.uid).waitForPendingUpdate(addDocUpdate)

    const id = 9
    const title = '1984'
    const { updateId } = await client
      .index(indexNoPk.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexNoPk.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
    await client
      .index(indexNoPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length + 1)
      })
  })

  test(`${permission} key: Add document with update documents function from index that has a primary key`, async () => {
    const { updateId: addDocUpdate } = await client
      .index(indexPk.uid)
      .addDocuments(dataset)
    await client.index(indexPk.uid).waitForPendingUpdate(addDocUpdate)

    const id = 9
    const title = '1984'
    const { updateId } = await client
      .index(indexPk.uid)
      .updateDocuments([{ id, title }])
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexPk.uid)
      .getDocument(id)
      .then((response) => {
        expect(response).toHaveProperty('id', id)
        expect(response).toHaveProperty('title', title)
      })
    await client
      .index(indexPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length + 1)
      })
  })

  test(`${permission} key: Delete a document from index that has NO primary key`, async () => {
    const { updateId: addDocUpdate } = await client
      .index(indexNoPk.uid)
      .addDocuments(dataset)
    await client.index(indexNoPk.uid).waitForPendingUpdate(addDocUpdate)

    const id = 9
    const { updateId } = await client
      .index(indexNoPk.uid)
      .deleteDocument(id)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexNoPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })

  test(`${permission} key: Delete a document from index that has a primary key`, async () => {
    const { updateId: addDocUpdate } = await client
      .index(indexPk.uid)
      .addDocuments(dataset)
    await client.index(indexPk.uid).waitForPendingUpdate(addDocUpdate)

    const id = 9
    const { updateId } = await client
      .index(indexPk.uid)
      .deleteDocument(id)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length)
      })
  })

  test(`${permission} key: Delete some documents from index that has NO primary key`, async () => {
    const { updateId: addDocUpdate } = await client
      .index(indexNoPk.uid)
      .addDocuments(dataset)
    await client.index(indexNoPk.uid).waitForPendingUpdate(addDocUpdate)

    const ids = [1, 2]
    const { updateId } = await client
      .index(indexNoPk.uid)
      .deleteDocuments(ids)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexNoPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(dataset.length - 2)
        const returnedIds = response.map((x) => x.id)
        expect(returnedIds).not.toContain(ids[0])
        expect(returnedIds).not.toContain(ids[1])
      })
  })

  test(`${permission} key: Delete some documents from index that has a primary key`, async () => {
    const { updateId: addDocUpdate } = await client
      .index(indexPk.uid)
      .addDocuments(dataset)
    await client.index(indexPk.uid).waitForPendingUpdate(addDocUpdate)

    const ids = [1, 2]
    const { updateId } = await client
      .index(indexPk.uid)
      .deleteDocuments(ids)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexPk.uid)
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
      .index(indexNoPk.uid)
      .deleteAllDocuments()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexNoPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexNoPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(0)
      })
  })

  test(`${permission} key: Delete all document from index that has a primary key`, async () => {
    const { updateId } = await client
      .index(indexPk.uid)
      .deleteAllDocuments()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexPk.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexPk.uid)
      .getDocuments()
      .then((response) => {
        expect(response.length).toEqual(0)
      })
  })

  test(`${permission} key: Try to get deleted document from index that has NO primary key`, async () => {
    await expect(
      client.index(indexNoPk.uid).getDocument(1)
    ).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.DOCUMENT_NOT_FOUND
    )
  })

  test(`${permission} key: Try to get deleted document from index that has a primary key`, async () => {
    await expect(
      client.index(indexPk.uid).getDocument(1)
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
    await expect(
      client.index(indexNoPk.uid).addDocuments([
        {
          unique: 2,
          title: 'Le Rouge et le Noir',
        },
      ])
    ).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.MISSING_PRIMARY_KEY
    )
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on documents',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

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
    beforeEach(() => {
      return clearAllIndexes(config)
    })

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

describe('Tests on url construction', () => {
  test(`Test getDocument route`, async () => {
    const route = `indexes/${indexPk.uid}/documents/1`
    await expect(
      badHostClient.index(indexPk.uid).getDocument(1)
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getDocuments route`, async () => {
    const route = `indexes/${indexPk.uid}/documents`
    await expect(
      badHostClient.index(indexPk.uid).getDocuments()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test addDocuments route`, async () => {
    const route = `indexes/${indexPk.uid}/documents`
    await expect(
      badHostClient.index(indexPk.uid).addDocuments([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateDocuments route`, async () => {
    const route = `indexes/${indexPk.uid}/documents`
    await expect(
      badHostClient.index(indexPk.uid).updateDocuments([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test deleteDocument route`, async () => {
    const route = `indexes/${indexPk.uid}/documents/1`
    await expect(
      badHostClient.index(indexPk.uid).deleteDocument('1')
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test deleteDocuments route`, async () => {
    const route = `indexes/${indexPk.uid}/documents/delete-batch`
    await expect(
      badHostClient.index(indexPk.uid).deleteDocuments([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test deleteAllDocuments route`, async () => {
    const route = `indexes/${indexPk.uid}/documents`
    await expect(
      badHostClient.index(indexPk.uid).deleteAllDocuments()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
