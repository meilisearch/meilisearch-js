import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  PUBLIC_KEY,
  MeiliSearch,
  MASTER_KEY,
  PRIVATE_KEY,
  BAD_HOST,
  badHostClient,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
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
  { key: MASTER_KEY, permission: 'Master' },
  { key: PRIVATE_KEY, permission: 'Private' },
  { key: PUBLIC_KEY, permission: 'Public' },
])('Test on client instance', ({ key, permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config)
  })

  test(`${permission} key: Create client with api key`, async () => {
    const client = new MeiliSearch({
      ...config,
      apiKey: key,
    })
    const health = await client.isHealthy()
    expect(health).toBe(true)
  })

  test(`${permission} key: Create client with custom headers`, async () => {
    const client = new MeiliSearch({
      ...config,
      apiKey: key,
      headers: {
        Expect: '200-OK',
      },
    })
    expect(client.config.headers).toStrictEqual({ Expect: '200-OK' })
    const health = await client.isHealthy()
    expect(health).toBe(true)
  })

  test(`${permission} key: No double slash when on host with domain and path and trailing slash`, async () => {
    try {
      const customHost = `${BAD_HOST}/api/`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e) {
      expect(e.message).toMatch(`${BAD_HOST}/api/health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: No double slash when on host with domain and path and no trailing slash`, async () => {
    try {
      const customHost = `${BAD_HOST}/api`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e) {
      expect(e.message).toMatch(`${BAD_HOST}/api/health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: host with double slash should keep double slash`, async () => {
    try {
      const customHost = `${BAD_HOST}//`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e) {
      expect(e.message).toMatch(`${BAD_HOST}//health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: host with one slash should not double slash`, async () => {
    try {
      const customHost = `${BAD_HOST}/`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e) {
      expect(e.message).toMatch(`${BAD_HOST}/health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: bad host raise CommunicationError`, async () => {
    const client = new MeiliSearch({ host: 'http://localhost:9345' })
    try {
      await client.health()
    } catch (e) {
      expect(e.type).toEqual('MeiliSearchCommunicationError')
    }
  })
})

describe.each([
  { key: MASTER_KEY, permission: 'Master' },
  { key: PRIVATE_KEY, permission: 'Private' },
])('Test on client', ({ key, permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config)
  })

  test(`${permission} key: Create client with custom headers`, async () => {
    const client = new MeiliSearch({
      ...config,
      apiKey: key,
      headers: {
        Expect: '200-OK',
      },
    })
    expect(client.config.headers).toStrictEqual({ Expect: '200-OK' })
    const health = await client.isHealthy()
    expect(health).toBe(true)
    await client.getOrCreateIndex('test')
    const indexes = await client.listIndexes()
    expect(indexes.length).toBe(1)
  })
})

describe('Tests on client methods w/ master key', () => {
  beforeEach(() => {
    return clearAllIndexes(config)
  })

  test(`Master key: Should get keys`, async () => {
    const client = new MeiliSearch({
      ...config,
      apiKey: MASTER_KEY,
    })
    const keys = await client.getKeys()
    expect(keys).toHaveProperty(
      'private',
      '8dcbb482663333d0280fa9fedf0e0c16d52185cb67db494ce4cd34da32ce2092'
    )
    expect(keys).toHaveProperty(
      'public',
      '3b3bf839485f90453acc6159ba18fbed673ca88523093def11a9b4f4320e44a5'
    )
  })
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on client w/ master and private key', ({ client, permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config)
  })

  describe('Test on indexes methods', () => {
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

      await client.getIndex(indexNoPk.uid).then((response) => {
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

    test(`${permission} key: get all indexes when not empty`, async () => {
      await client.createIndex(indexPk.uid)
      await client.listIndexes().then((response: Types.IndexResponse[]) => {
        const indexes = response.map((index) => index.uid)
        expect(indexes).toEqual(expect.arrayContaining([indexPk.uid]))
        expect(indexes.length).toEqual(1)
      })
    })

    test(`${permission} key: Get index that exists`, async () => {
      await client.createIndex(indexPk.uid)
      await client.getIndex(indexPk.uid).then((response) => {
        expect(response).toHaveProperty('uid', indexPk.uid)
      })
    })

    test(`${permission} key: Get index that does not exist`, async () => {
      await expect(client.getIndex('does_not_exist')).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_NOT_FOUND
      )
    })

    test(`${permission} key: update primary key`, async () => {
      await client.createIndex(indexPk.uid)
      await client
        .updateIndex(indexPk.uid, { primaryKey: 'newPrimaryKey' })
        .then((response: Types.Index<any>) => {
          expect(response).toHaveProperty('uid', indexPk.uid)
          expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
        })
    })

    test(`${permission} key: update primary key that already exists`, async () => {
      await client.createIndex(indexPk.uid, {
        primaryKey: indexPk.primaryKey,
      })
      await expect(
        client.updateIndex(indexPk.uid, {
          primaryKey: 'newPrimaryKey',
        })
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.PRIMARY_KEY_ALREADY_PRESENT
      )
    })

    test(`${permission} key: delete index`, async () => {
      await client.createIndex(indexNoPk.uid)
      await client.deleteIndex(indexNoPk.uid).then((response: void) => {
        expect(response).toBe(undefined)
      })
      await expect(client.listIndexes()).resolves.toHaveLength(0)
    })

    test(`${permission} key: create index with already existing uid should fail`, async () => {
      await client.createIndex(indexPk.uid)
      await expect(client.createIndex(indexPk.uid)).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_ALREADY_EXISTS
      )
    })

    test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
      const index = client.index(indexNoPk.uid)
      await expect(index.delete()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_NOT_FOUND
      )
    })
  })

  describe('Test on base routes', () => {
    test(`${permission} key: get health`, async () => {
      await client.health().then((response: Types.Health) => {
        expect(response).toHaveProperty(
          'status',
          expect.stringMatching('available')
        )
      })
    })

    test(`${permission} key: is server healthy`, async () => {
      await client.isHealthy().then((response: boolean) => {
        expect(response).toBe(true)
      })
    })

    test(`${permission} key: is healthy return false on bad host`, async () => {
      const client = new MeiliSearch({ host: 'http://localhost:9345' })
      await client.isHealthy().then((response: boolean) => {
        expect(response).toBe(false)
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
  'Test on misc client methods w/ public apikey',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    describe('Test on indexes methods', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        await expect(client.listIndexes()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
    })

    describe('Test on misc client methods', () => {
      test(`${permission} key: get health`, async () => {
        await client.health().then((response: Types.Health) => {
          expect(response).toHaveProperty(
            'status',
            expect.stringMatching('available')
          )
        })
      })

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

      test(`${permission} key: try to create dumps and be denir`, async () => {
        await expect(client.createDump()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to create dumps and be denied`, async () => {
        await expect(client.getDumpStatus('test')).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.INVALID_TOKEN
        )
      })
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on misc client methods w/ no apiKey client',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    describe('Test on indexes methods', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        await expect(client.listIndexes()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
    })

    describe('Test on misc client methods', () => {
      test(`${permission} key: get health`, async () => {
        await client.health().then((response: Types.Health) => {
          expect(response).toHaveProperty(
            'status',
            expect.stringMatching('available')
          )
        })
      })

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

      test(`${permission} key: try to create dumps and be denir`, async () => {
        await expect(client.createDump()).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create dumps and be denied`, async () => {
        await expect(client.getDumpStatus('test')).rejects.toHaveProperty(
          'errorCode',
          Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
    })
  }
)

describe('Tests on url construction', () => {
  test(`Test getIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    await expect(badHostClient.getIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test createIndex route`, async () => {
    const route = `indexes`
    await expect(badHostClient.createIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    await expect(badHostClient.updateIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test deleteIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    await expect(badHostClient.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test listIndexes route`, async () => {
    const route = `indexes`
    await expect(badHostClient.listIndexes()).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getKeys route`, async () => {
    const route = `keys`
    await expect(badHostClient.getKeys()).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test health route`, async () => {
    const route = `health`
    await expect(badHostClient.health()).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test stats route`, async () => {
    const route = `stats`
    await expect(badHostClient.stats()).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test version route`, async () => {
    const route = `version`
    await expect(badHostClient.version()).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test createDump route`, async () => {
    const route = `dumps`
    await expect(badHostClient.createDump()).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getDumpStatus route`, async () => {
    const route = `dumps/1/status`
    await expect(badHostClient.getDumpStatus('1')).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
