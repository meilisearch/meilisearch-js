import { IndexResponse, ErrorStatusCode } from '../src/types'
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

afterAll(async () => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on indexes w/ master and private key',
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: create index with NO primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(uid)
      const newIndex = await client.getIndex(indexNoPk.uid)

      expect(newIndex).toHaveProperty('uid', indexNoPk.uid)
      expect(newIndex).toHaveProperty('primaryKey', null)

      const rawIndex: IndexResponse = await client
        .index(indexNoPk.uid)
        .getRawInfo()

      expect(rawIndex).toHaveProperty('uid', indexNoPk.uid)
      expect(rawIndex).toHaveProperty('primaryKey', null)
      expect(rawIndex).toHaveProperty('createdAt', expect.any(String))
      expect(rawIndex).toHaveProperty('updatedAt', expect.any(String))
    })

    test(`${permission} key: create index with primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(uid)
      const newIndex = await client.getIndex(indexPk.uid)

      expect(newIndex).toHaveProperty('uid', indexPk.uid)
      expect(newIndex).toHaveProperty('primaryKey', indexPk.primaryKey)

      const rawIndex: IndexResponse = await client
        .index(indexPk.uid)
        .getRawInfo()
      expect(rawIndex).toHaveProperty('uid', indexPk.uid)
      expect(rawIndex).toHaveProperty('primaryKey', indexPk.primaryKey)
      expect(rawIndex).toHaveProperty('createdAt', expect.any(String))
      expect(rawIndex).toHaveProperty('updatedAt', expect.any(String))
    })

    test(`${permission} key: Get raw index that exists`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexPk.uid)
      await client.waitForTask(uid)

      const response = await client.getRawIndex(indexPk.uid)
      expect(response).toHaveProperty('uid', indexPk.uid)
    })

    test(`${permission} key: Get index that does not exist`, async () => {
      const client = await getClient(permission)
      await expect(client.getIndex('does_not_exist')).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INDEX_NOT_FOUND
      )
    })

    test(`${permission} key: Get raw index that does not exist`, async () => {
      const client = await getClient(permission)
      await expect(client.getRawIndex('does_not_exist')).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INDEX_NOT_FOUND
      )
    })

    test(`${permission} key: Get raw index info through client with primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(uid)
      const response = await client.getRawIndex(indexPk.uid)

      expect(response).toHaveProperty('uid', indexPk.uid)
      expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
    })

    test(`${permission} key: Get raw index info through client with NO primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(uid)

      const response = await client.getRawIndex(indexNoPk.uid)

      expect(response).toHaveProperty('uid', indexNoPk.uid)
      expect(response).toHaveProperty('primaryKey', null)
    })

    test(`${permission} key: Get raw index info with primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(uid)
      const response = await client.index(indexPk.uid).getRawInfo()

      expect(response).toHaveProperty('uid', indexPk.uid)
      expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
    })

    test(`${permission} key: Get raw index info with NO primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(uid)

      const response = await client.index(indexNoPk.uid).getRawInfo()
      expect(response).toHaveProperty('uid', indexNoPk.uid)
      expect(response).toHaveProperty('primaryKey', null)
    })

    // test(`${permission} key: Get index info with NO primary key`, async () => {
    // const client = await getClient(permission)
    //   const { uid: firstCreateTask } = await client.createIndex(indexNoPk.uid)
    //   const firstTask = await client.waitForTask(firstCreateTask)
    //   const { uid: secondCreateTask } = await client.createIndex(indexNoPk.uid)
    //   const secondTask = await client.waitForTask(secondCreateTask)

    //   const index = client.index(indexNoPk.uid)
    //   const response = await index.getRawInfo()
    //   expect(firstTask).toHaveProperty('status', 'succeeded')
    //   expect(secondTask).toHaveProperty('status', 'failed')
    //   expect(response).toHaveProperty('uid', indexNoPk.uid)
    //   expect(response).toHaveProperty('primaryKey', null)
    // })

    test(`${permission} key: fetch index with primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(uid)

      const index = client.index(indexPk.uid)
      const response = await index.fetchInfo()
      expect(response).toHaveProperty('uid', indexPk.uid)
      expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
    })

    test(`${permission} key: fetch primary key on an index with primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(uid)

      const index = client.index(indexPk.uid)
      const response: string | undefined = await index.fetchPrimaryKey()
      expect(response).toBe(indexPk.primaryKey)
    })

    test(`${permission} key: fetch primary key on an index with NO primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(uid)

      const index = client.index(indexNoPk.uid)
      const response: string | undefined = await index.fetchPrimaryKey()
      expect(response).toBe(null)
    })

    test(`${permission} key: fetch index with primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(uid)

      const index = client.index(indexPk.uid)
      const response = await index.fetchInfo()
      expect(response).toHaveProperty('uid', indexPk.uid)
      expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
    })

    test(`${permission} key: fetch index with NO primary key`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(uid)

      const index = client.index(indexNoPk.uid)
      const response = await index.fetchInfo()
      expect(response).toHaveProperty('uid', indexNoPk.uid)
      expect(response).toHaveProperty('primaryKey', null)
    })

    test(`${permission} key: update primary key on an index that has no primary key already`, async () => {
      const client = await getClient(permission)
      const { uid: createTask } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(createTask)

      const { uid: updateTask } = await client.index(indexNoPk.uid).update({
        primaryKey: 'newPrimaryKey',
      })
      await client.waitForTask(updateTask)

      const index = await client.getIndex(indexNoPk.uid)
      expect(index).toHaveProperty('uid', indexNoPk.uid)
      expect(index).toHaveProperty('primaryKey', 'newPrimaryKey')
    })

    test(`${permission} key: update primary key on an index that has NO primary key already through client`, async () => {
      const client = await getClient(permission)
      const { uid: createTask } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(createTask)

      const { uid: updateTask } = await client.updateIndex(indexNoPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(updateTask)

      const index = await client.getIndex(indexNoPk.uid)
      expect(index).toHaveProperty('uid', indexNoPk.uid)
      expect(index).toHaveProperty('primaryKey', indexPk.primaryKey)
    })

    test(`${permission} key: update primary key on an index that has already a primary key and fail through client`, async () => {
      const client = await getClient(permission)
      const { uid: createTask } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(createTask)

      const { uid: updateTask } = await client.updateIndex(indexPk.uid, {
        primaryKey: 'newPrimaryKey',
      })
      await client.waitForTask(updateTask)

      const index = await client.getIndex(indexPk.uid)

      expect(index).toHaveProperty('uid', indexPk.uid)
      expect(index).toHaveProperty('primaryKey', 'newPrimaryKey')
    })

    test(`${permission} key: update primary key on an index that has already a primary key and fail`, async () => {
      const client = await getClient(permission)
      const { uid: createTask } = await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await client.waitForTask(createTask)

      const { uid: updateTask } = await client.index(indexPk.uid).update({
        primaryKey: 'newPrimaryKey',
      })
      await client.waitForTask(updateTask)

      const index = await client.getIndex(indexPk.uid)

      expect(index).toHaveProperty('uid', indexPk.uid)
      expect(index).toHaveProperty('primaryKey', 'newPrimaryKey')
    })

    test(`${permission} key: delete index`, async () => {
      const client = await getClient(permission)
      const { uid: createTask } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(createTask)

      const { uid: updateTask } = await client.index(indexNoPk.uid).delete()
      await client.waitForTask(updateTask)

      await expect(client.getIndexes()).resolves.toHaveLength(0)
    })

    test(`${permission} key: delete index using client`, async () => {
      const client = await getClient(permission)
      await client.createIndex(indexPk.uid)
      const { uid } = await client.deleteIndex(indexPk.uid)
      await client.waitForTask(uid)

      await expect(client.getIndexes()).resolves.toHaveLength(0)
    })

    test(`${permission} key: fetch deleted index should fail`, async () => {
      const client = await getClient(permission)
      const index = client.index(indexNoPk.uid)
      await expect(index.getRawInfo()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INDEX_NOT_FOUND
      )
    })

    test(`${permission} key: get deleted raw index should fail through client`, async () => {
      const client = await getClient(permission)
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INDEX_NOT_FOUND
      )
    })

    test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
      const client = await getClient(permission)
      const index = client.index(indexNoPk.uid)
      const { uid } = await index.delete()
      const task = await client.waitForTask(uid)
      expect(task.status).toBe('failed')
    })

    test(`${permission} key: get stats of an index`, async () => {
      const client = await getClient(permission)
      const { uid } = await client.createIndex(indexNoPk.uid)
      await client.waitForTask(uid)

      const response = await client.index(indexNoPk.uid).getStats()
      expect(response).toHaveProperty('numberOfDocuments', 0)
      expect(response).toHaveProperty('isIndexing', false)
      expect(response).toHaveProperty('fieldDistribution', {})
    })

    // TODO: Skipped until discussed
    test.skip(`${permission} key: delete if exists when index is present`, async () => {
      // const client = await getClient(permission)
      // const { uid } = await client.createIndex(indexPk.uid)
      // const response: boolean = await index.deleteIfExists()
      // expect(response).toBe(true)
      // await expect(client.getIndex(indexPk.uid)).rejects.toHaveProperty(
      //   'code',
      //   ErrorStatusCode.INDEX_NOT_FOUND
      // )
    })

    // TODO: Skipped until discussed
    test.skip(`${permission} key: delete if exists when index is not present`, async () => {
      // const client = await getClient(permission)
      // const indexes = await client.getIndexes()
      // const index = client.index('badIndex')
      // const response: boolean = await index.deleteIfExists()
      // expect(response).toBe(false)
      // await expect(client.getIndex('badIndex')).rejects.toHaveProperty(
      //   'code',
      //   ErrorStatusCode.INDEX_NOT_FOUND
      // )
      // await expect(client.getIndexes()).resolves.toHaveLength(indexes.length)
    })

    // test(`${permission} key: delete if exists error`, async () => {
    // const client = await getClient(permission)
    //   const index = badHostClient.index(indexPk.uid)
    //   await expect(index.deleteIfExists()).rejects.toThrow()
    // })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on routes with public key',
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: try to get index info and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(indexNoPk.uid).getRawInfo()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to get raw index and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })

    test(`${permission} key: try to delete index and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })

    test(`${permission} key: try to update index and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey })
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to get stats and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.index(indexPk.uid).getStats()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on routes without an API key',
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: try to get all indexes and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getIndexes()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get index info and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(indexNoPk.uid).getRawInfo()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get raw index and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getRawIndex(indexNoPk.uid)).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to delete index and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update index and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey })
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
  test(`Test getStats route`, async () => {
    const route = `indexes/${indexPk.uid}/stats`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getStats()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getRawInfo route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'type',
      'MeiliSearchCommunicationError'
    )
  })

  test(`Test getRawIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getRawIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
    await expect(client.getRawIndex(indexPk.uid)).rejects.toHaveProperty(
      'type',
      'MeiliSearchCommunicationError'
    )
  })

  test(`Test updateIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test delete index route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(indexPk.uid).getRawInfo()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
