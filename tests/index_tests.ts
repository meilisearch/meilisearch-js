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
  MeiliSearch,
} from './meilisearch-test-utils'

const indexNoPk = {
  uid: 'movies_test',
}
const indexPk = {
  uid: 'movies_test2',
  primaryKey: 'id',
}

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on indexes w/ master and private key', ({ client, permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config)
  })
  test(`${permission} key: create with no primary key`, async () => {
    await client.createIndex(indexNoPk.uid).then((response) => {
      expect(response).toHaveProperty('uid', indexNoPk.uid)
      expect(response).toHaveProperty('primaryKey', null)
    })

    await client
      .index(indexNoPk.uid)
      .getRawInfo()
      .then((response: Types.IndexResponse) => {
        expect(response).toHaveProperty('uid', indexNoPk.uid)
        expect(response).toHaveProperty('primaryKey', null)
        expect(response).toHaveProperty('createdAt', expect.any(String))
        expect(response).toHaveProperty('updatedAt', expect.any(String))
      })

    await client
      .index(indexNoPk.uid)
      .fetchInfo()
      .then((response) => {
        expect(response.primaryKey).toBe(null)
        expect(response.uid).toBe(indexNoPk.uid)
      })
  })

  test(`${permission} key: create with primary key`, async () => {
    await client
      .createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      .then((response) => {
        expect(response).toHaveProperty('uid', indexPk.uid)
        expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
      })
    await client
      .index(indexPk.uid)
      .getRawInfo()
      .then((response: Types.IndexResponse) => {
        expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
        expect(response).toHaveProperty('createdAt', expect.any(String))
        expect(response).toHaveProperty('updatedAt', expect.any(String))
      })
    await client.getIndex(indexPk.uid).then((response) => {
      expect(response.primaryKey).toBe(indexPk.primaryKey)
      expect(response.uid).toBe(indexPk.uid)
    })
  })

  test(`${permission} key: Get index that exists`, async () => {
    await client.createIndex(indexPk.uid)
    await client
      .index(indexPk.uid)
      .getRawInfo()
      .then((response) => {
        expect(response).toHaveProperty('uid', indexPk.uid)
      })
  })

  test(`${permission} key: Get index that does not exist`, async () => {
    await expect(client.getIndex('does_not_exist')).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: Get index info with primary key`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    await index.getRawInfo().then((response: Types.IndexResponse) => {
      expect(response).toHaveProperty('uid', indexPk.uid)
      expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
    })
  })

  test(`${permission} key: Get index info with NO primary key`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    await index.getRawInfo().then((response: Types.IndexResponse) => {
      expect(response).toHaveProperty('uid', indexNoPk.uid)
      expect(response).toHaveProperty('primaryKey', null)
    })
  })

  test(`${permission} key: fetch index with primary key`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    await index.fetchInfo().then((response: Types.Index<any>) => {
      expect(response).toHaveProperty('uid', indexPk.uid)
      expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
    })
  })

  test(`${permission} key: fetch primary key on an index with NO primary key`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    await index.fetchPrimaryKey().then((response: string | undefined) => {
      expect(response).toBe(null)
    })
  })

  test(`${permission} key: fetch primary key on an index with primary key`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    await index.fetchPrimaryKey().then((response: string | undefined) => {
      expect(response).toBe(indexPk.primaryKey)
    })
  })

  test(`${permission} key: fetch index with NO primary key`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    await index.fetchInfo().then((response: Types.Index<any>) => {
      expect(response).toHaveProperty('uid', indexNoPk.uid)
      expect(response).toHaveProperty('primaryKey', null)
    })
  })

  test(`${permission} key: update primary key on an index that has no primary key already`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    await index
      .update({ primaryKey: 'newPrimaryKey' })
      .then((response: Types.Index<any>) => {
        expect(response).toHaveProperty('uid', indexNoPk.uid)
        expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
      })
  })

  test(`${permission} key: update primary key on an index that has no primary key already using client`, async () => {
    await client.createIndex(indexPk.uid)
    await client
      .updateIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      .then((response: Types.Index<any>) => {
        expect(response).toHaveProperty('uid', indexPk.uid)
        expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
      })
  })

  test(`${permission} key: update primary key on an index that has already a primary key and fail`, async () => {
    const index = await client.createIndex(indexPk.uid, {
      primaryKey: indexPk.primaryKey,
    })
    await expect(
      index.update({ primaryKey: 'newPrimaryKey' })
    ).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.PRIMARY_KEY_ALREADY_PRESENT
    )
  })

  test(`${permission} key: delete index`, async () => {
    const index = await client.createIndex(indexNoPk.uid)
    await index.delete().then((response: void) => {
      expect(response).toBe(undefined)
    })
    await expect(client.listIndexes()).resolves.toHaveLength(0)
  })

  test(`${permission} key: fetch deleted index should fail`, async () => {
    const index = client.index(indexNoPk.uid)
    await expect(index.getRawInfo()).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
    const index = client.index(indexNoPk.uid)
    await expect(index.delete()).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: get stats of an index`, async () => {
    const index = await client.createIndex(indexNoPk.uid)

    const response = await index.getStats()
    expect(response).toHaveProperty('numberOfDocuments', 0)
    expect(response).toHaveProperty('isIndexing', false)
    expect(response).toHaveProperty('fieldDistribution', {})
  })

  test(`${permission} key: delete if exists when index is present`, async () => {
    const index = await client.createIndex(indexPk.uid)
    await index.deleteIfExists().then((response: boolean) => {
      expect(response).toBe(true)
    })
    await expect(client.getIndex(indexPk.uid)).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.INDEX_NOT_FOUND
    )
  })

  test(`${permission} key: delete if exists when index is not present`, async () => {
    const indexes = await client.listIndexes()
    const index = client.index('badIndex')
    await index.deleteIfExists().then((response: boolean) => {
      expect(response).toBe(false)
    })
    await expect(client.getIndex('badIndex')).rejects.toHaveProperty(
      'errorCode',
      Types.ErrorStatusCode.INDEX_NOT_FOUND
    )
    await expect(client.listIndexes()).resolves.toHaveLength(indexes.length)
  })

  test(`${permission} key: delete if exists error`, async () => {
    const index = badHostClient.index(indexPk.uid)
    await expect(index.deleteIfExists()).rejects.toThrow()
  })

  test(`${permission} key: delete index using client`, async () => {
    await client.createIndex(indexPk.uid)
    await client.deleteIndex(indexPk.uid).then((response: void) => {
      expect(response).toBe(undefined)
    })
    await expect(client.listIndexes()).resolves.toHaveLength(0)
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on routes with public key',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: try to get index info and be denied`, async () => {
      await expect(
        client.index(indexNoPk.uid).getRawInfo()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to delete index and be denied`, async () => {
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })

    test(`${permission} key: try to update index and be denied`, async () => {
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey })
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to get stats and be denied`, async () => {
      await expect(client.index(indexPk.uid).getStats()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on routes without an API key',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: try to get all indexes and be denied`, async () => {
      await expect(client.listIndexes()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get index info and be denied`, async () => {
      await expect(
        client.index(indexNoPk.uid).getRawInfo()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to delete index and be denied`, async () => {
      await expect(client.index(indexPk.uid).delete()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update index and be denied`, async () => {
      await expect(
        client.index(indexPk.uid).update({ primaryKey: indexPk.primaryKey })
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
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
