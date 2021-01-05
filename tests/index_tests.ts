import MeiliSearch, * as Types from '../src/types'
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

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on indexes', ({ client, permission }) => {
  describe('Test on indexes', () => {
    beforeAll(() => {
      return clearAllIndexes(config)
    })
    test(`${permission} key: get all indexes when empty`, async () => {
      const expected: Types.IndexResponse[] = []
      await client.listIndexes().then((response: Types.IndexResponse[]) => {
        expect(response).toEqual(expected)
      })
      await expect(client.listIndexes()).resolves.toHaveLength(0)
    })
    test(`${permission} key: create with no primary key`, async () => {
      await client.createIndex(uidNoPrimaryKey.uid).then((response) => {
        expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
        expect(response).toHaveProperty('primaryKey', null)
      })

      await client
        .index(uidNoPrimaryKey.uid)
        .getRawInfo()
        .then((response: Types.IndexResponse) => {
          expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
          expect(response).toHaveProperty('primaryKey', null)
          expect(response).toHaveProperty('createdAt', expect.any(String))
          expect(response).toHaveProperty('updatedAt', expect.any(String))
        })

      await client.getIndex(uidNoPrimaryKey.uid).then((response) => {
        expect(response.primaryKey).toBe(null)
        expect(response.uid).toBe(uidNoPrimaryKey.uid)
      })
    })
    test(`${permission} key: create with primary key`, async () => {
      await client
        .createIndex(uidAndPrimaryKey.uid, {
          primaryKey: uidAndPrimaryKey.primaryKey,
        })
        .then((response) => {
          expect(response).toHaveProperty('uid', uidAndPrimaryKey.uid)
          expect(response).toHaveProperty(
            'primaryKey',
            uidAndPrimaryKey.primaryKey
          )
        })
      await client
        .index(uidAndPrimaryKey.uid)
        .getRawInfo()
        .then((response: Types.IndexResponse) => {
          expect(response).toHaveProperty(
            'primaryKey',
            uidAndPrimaryKey.primaryKey
          )
          expect(response).toHaveProperty('createdAt', expect.any(String))
          expect(response).toHaveProperty('updatedAt', expect.any(String))
        })
      await client.getIndex(uidAndPrimaryKey.uid).then((response) => {
        expect(response.primaryKey).toBe(uidAndPrimaryKey.primaryKey)
        expect(response.uid).toBe(uidAndPrimaryKey.uid)
      })
    })
    test(`${permission} key: get all indexes when not empty`, async () => {
      await client.listIndexes().then((response: Types.IndexResponse[]) => {
        const indexes = response.map((index) => index.uid)
        expect(indexes).toEqual(expect.arrayContaining([uidAndPrimaryKey.uid]))
        expect(indexes).toEqual(expect.arrayContaining([uidNoPrimaryKey.uid]))
        expect(indexes.length).toEqual(2)
      })
    })

    test(`${permission} key: Get index that exists`, async () => {
      await client.getIndex(uidAndPrimaryKey.uid).then((response) => {
        expect(response).toHaveProperty('uid', uidAndPrimaryKey.uid)
      })
    })

    test(`${permission} key: Get index that does not exist`, async () => {
      await expect(client.getIndex('does_not_exist')).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_NOT_FOUND
      )
    })

    test(`${permission} key: Get index info with primary key`, async () => {
      const index = client.index(uidAndPrimaryKey.uid)
      await index.getRawInfo().then((response: Types.IndexResponse) => {
        expect(response).toHaveProperty('uid', uidAndPrimaryKey.uid)
        expect(response).toHaveProperty(
          'primaryKey',
          uidAndPrimaryKey.primaryKey
        )
      })
    })

    test(`${permission} key: Get index info with NO primary key`, async () => {
      const index = client.index(uidNoPrimaryKey.uid)
      await index.getRawInfo().then((response: Types.IndexResponse) => {
        expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
        expect(response).toHaveProperty('primaryKey', null)
      })
    })

    test(`${permission} key: fetch index with primary key`, async () => {
      const index = client.index(uidAndPrimaryKey.uid)
      await index.fetchInfo().then((response: Types.Index<any>) => {
        expect(response).toHaveProperty('uid', uidAndPrimaryKey.uid)
        expect(response).toHaveProperty(
          'primaryKey',
          uidAndPrimaryKey.primaryKey
        )
      })
    })

    test(`${permission} key: fetch primary key on an index with NO primary key`, async () => {
      const index = client.index(uidNoPrimaryKey.uid)
      await index.fetchPrimaryKey().then((response: string | undefined) => {
        expect(response).toBe(null)
      })
    })

    test(`${permission} key: fetch primary key on an index with primary key`, async () => {
      const index = client.index(uidAndPrimaryKey.uid)
      await index.fetchPrimaryKey().then((response: string | undefined) => {
        expect(response).toBe(uidAndPrimaryKey.primaryKey)
      })
    })

    test(`${permission} key: fetch index with NO primary key`, async () => {
      const index = client.index(uidNoPrimaryKey.uid)
      await index.fetchInfo().then((response: Types.Index<any>) => {
        expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
        expect(response).toHaveProperty('primaryKey', null)
      })
    })

    test(`${permission} key: update primary key on an index that has no primary key already`, async () => {
      const index = client.index(uidNoPrimaryKey.uid)
      await index
        .update({ primaryKey: 'newPrimaryKey' })
        .then((response: Types.Index<any>) => {
          expect(response).toHaveProperty('uid', uidNoPrimaryKey.uid)
          expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
        })
    })

    test(`${permission} key: update primary key on an index that has no primary key already using client`, async () => {
      await client.createIndex('tempIndex')
      await client
        .updateIndex('tempIndex', { primaryKey: 'newPrimaryKey' })
        .then((response: Types.Index<any>) => {
          expect(response).toHaveProperty('uid', 'tempIndex')
          expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
        })
      await client.deleteIndex('tempIndex')
    })

    test(`${permission} key: update primary key on an index that has already a primary key and fail`, async () => {
      const index = client.index(uidAndPrimaryKey.uid)
      await expect(
        index.update({ primaryKey: 'newPrimaryKey' })
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.PRIMARY_KEY_ALREADY_PRESENT
      )
    })

    test(`${permission} key: delete index`, async () => {
      const index = client.index(uidNoPrimaryKey.uid)
      await index.delete().then((response: void) => {
        expect(response).toBe(undefined)
      })
      await expect(client.listIndexes()).resolves.toHaveLength(1)
    })

    test(`${permission} key: delete index using client`, async () => {
      await client.createIndex('tempIndex')
      await client.deleteIndex('tempIndex').then((response: void) => {
        expect(response).toBe(undefined)
      })
      await expect(client.listIndexes()).resolves.toHaveLength(1)
    })

    test(`${permission} key: bad host should raise CommunicationError`, async () => {
      const client = new MeiliSearch({ host: 'http://localhost:9345' })
      try {
        await client.version()
      } catch (e) {
        expect(e.type).toEqual('MeiliSearchCommunicationError')
      }
    })
    test(`${permission} key: fetch deleted index should fail`, async () => {
      const index = client.index(uidNoPrimaryKey.uid)
      await expect(index.getRawInfo()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_NOT_FOUND
      )
    })

    test(`${permission} key: create index with already existing uid should fail`, async () => {
      await expect(
        client.createIndex(uidAndPrimaryKey.uid, {
          primaryKey: uidAndPrimaryKey.primaryKey,
        })
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_ALREADY_EXISTS
      )
    })

    test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
      const index = client.index(uidNoPrimaryKey.uid)
      await expect(index.delete()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_NOT_FOUND
      )
    })
  })
  describe('Test on base routes', () => {
    test(`${permission} key: get health`, async () => {
      await client.isHealthy().then((response: boolean) => {
        expect(response).toBe(true)
      })
    })
    test(`${permission} key: get version`, async () => {
      await client.version().then((response: Types.Version) => {
        expect(response).toHaveProperty('commitSha', expect.any(String))
        expect(response).toHaveProperty('buildDate', expect.any(String))
        expect(response).toHaveProperty('pkgVersion', expect.any(String))
      })
    })
    test(`${permission} key: get /stats information`, async () => {
      await client.stats().then((response: Types.Stats) => {
        expect(response).toHaveProperty('databaseSize', expect.any(Number))
        expect(response).toHaveProperty('lastUpdate') // TODO: Could be null, find out why
        expect(response).toHaveProperty('indexes', expect.any(Object))
      })
    })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on routes where public key should not have access',
  ({ client, permission }) => {
    describe('Test on indexes', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        await expect(client.listIndexes()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidAndPrimaryKey.uid, {
            primaryKey: uidAndPrimaryKey.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidNoPrimaryKey.uid)
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
      test(`${permission} key: try to get index info and be denied`, async () => {
        await expect(
          client.index(uidNoPrimaryKey.uid).getRawInfo()
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(
          client.index(uidAndPrimaryKey.uid).delete()
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client
            .index(uidAndPrimaryKey.uid)
            .update({ primaryKey: uidAndPrimaryKey.primaryKey })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
    })
    describe('Test on base routes', () => {
      test(`${permission} key: try to get version and be denied`, async () => {
        await expect(client.version()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
      test(`${permission} key: try to get /stats information and be denied`, async () => {
        await expect(client.stats()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on routes where client without api key should not have access',
  ({ client, permission }) => {
    describe('Test on indexes', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        await expect(client.listIndexes()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
      test(`${permission} key: try to create an index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidAndPrimaryKey.uid, {
            primaryKey: uidAndPrimaryKey.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
      test(`${permission} key: try to create an index with NO primary key and be denied`, async () => {
        await expect(
          client.createIndex(uidNoPrimaryKey.uid)
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
      test(`${permission} key: try to get index info and be denied`, async () => {
        await expect(
          client.index(uidNoPrimaryKey.uid).getRawInfo()
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(
          client.index(uidAndPrimaryKey.uid).delete()
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client
            .index(uidAndPrimaryKey.uid)
            .update({ primaryKey: uidAndPrimaryKey.primaryKey })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
    })
    describe('Test on base routes', () => {
      test(`${permission} key: try to get version and be denied`, async () => {
        await expect(client.version()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
      test(`${permission} key: try to get /stats information and be denied`, async () => {
        await expect(client.stats()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
    })
  }
)

test(`Create request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.createIndex(uidNoPrimaryKey.uid)
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes`)
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Update request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.updateIndex(uidNoPrimaryKey.uid)
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes/${uidNoPrimaryKey.uid}`)
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/${uidNoPrimaryKey.uid}/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Delete request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.deleteIndex(uidNoPrimaryKey.uid)
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes/${uidNoPrimaryKey.uid}`)
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/${uidNoPrimaryKey.uid}/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})

test(`Get all request should not add double slash nor a trailing slash`, async () => {
  try {
    const res = await badHostClient.listIndexes()
    expect(res).toBe(undefined) // Left here to trigger failed test if error is not thrown
  } catch (e) {
    expect(e.message).toMatch(`${BAD_HOST}/indexes`)
    expect(e.message).not.toMatch(`${BAD_HOST}/indexes/`)
    expect(e.type).toBe('MeiliSearchCommunicationError')
  }
})
