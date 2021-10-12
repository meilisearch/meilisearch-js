import {
  IndexResponse,
  ErrorStatusCode,
  Health,
  Version,
  Stats,
  Index,
} from '../src/'
import {
  clearAllIndexes,
  config,
  PUBLIC_KEY,
  MeiliSearch,
  MASTER_KEY,
  PRIVATE_KEY,
  BAD_HOST,
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

  test(`${permission} key: host without HTTP should not throw Invalid URL Error`, async () => {
    const client = new MeiliSearch({ host: 'meilisearch:7700' })
    const health = await client.isHealthy()
    expect(health).toBe(false)
  })

  test(`${permission} key: host without HTTP and port should not throw Invalid URL Error`, async () => {
    const client = new MeiliSearch({ host: 'meilisearch' })
    const health = await client.isHealthy()
    expect(health).toBe(false)
  })
})

describe.each([
  { client: masterClient, permission: 'Master', key: MASTER_KEY },
  { client: privateClient, permission: 'Private', key: PRIVATE_KEY },
])(
  'Test on client w/ master and private key',
  ({ client, permission, key }) => {
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
      const indexes = await client.getIndexes()
      expect(indexes.length).toBe(1)
    })

    describe('Test on indexes methods', () => {
      test(`${permission} key: create with no primary key`, async () => {
        const response=await client.createIndex(indexNoPk.uid)
        expect(response).toHaveProperty('uid', indexNoPk.uid)
          expect(response).toHaveProperty('primaryKey', null)

        const secondResponse=await client
          .index(indexNoPk.uid)
          .getRawInfo()
           expect(secondResponse).toHaveProperty('uid', indexNoPk.uid)
            expect(secondResponse).toHaveProperty('primaryKey', null)
            expect(secondResponse).toHaveProperty('createdAt', expect.any(String))
            expect(secondResponse).toHaveProperty('updatedAt', expect.any(String))

        const thirdResponse=await client.getIndex(indexNoPk.uid)
        expect(thirdResponse.primaryKey).toBe(null)
          expect(thirdResponse.uid).toBe(indexNoPk.uid)
      })
      
      test(`${permission} key: create with primary key`, async () => {
        const response=await client
          .createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
          expect(response).toHaveProperty('uid', indexPk.uid)
            expect(response).toHaveProperty('primaryKey', indexPk.primaryKey)
        const secondResponse=await client
          .index(indexPk.uid)
          .getRawInfo()
          expect(secondResponse).toHaveProperty('primaryKey', indexPk.primaryKey)
            expect(secondResponse).toHaveProperty('createdAt', expect.any(String))
            expect(secondResponse).toHaveProperty('updatedAt', expect.any(String))
        const thirdResponse=await client.getIndex(indexPk.uid)
        expect(thirdResponse.primaryKey).toBe(indexPk.primaryKey)
          expect(thirdResponse.uid).toBe(indexPk.uid)
      })

      test(`${permission} key: get all indexes when not empty`, async () => {
        await client.createIndex(indexPk.uid)
        const response: IndexResponse[]=await client.getIndexes()
        const indexes = response.map((index) => index.uid)
          expect(indexes).toEqual(expect.arrayContaining([indexPk.uid]))
          expect(indexes.length).toEqual(1)
      })

      test(`${permission} key: Get index that exists`, async () => {
        await client.createIndex(indexPk.uid)
        const response=await client.getIndex(indexPk.uid)
        expect(response).toHaveProperty('uid', indexPk.uid)
      })

      test(`${permission} key: Get index that does not exist`, async () => {
        await expect(client.getIndex('does_not_exist')).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INDEX_NOT_FOUND
        )
      })

      test(`${permission} key: update primary key`, async () => {
        await client.createIndex(indexPk.uid)
        const response=await client
          .updateIndex(indexPk.uid, { primaryKey: 'newPrimaryKey' })
            expect(response).toHaveProperty('uid', indexPk.uid)
            expect(response).toHaveProperty('primaryKey', 'newPrimaryKey')
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
          ErrorStatusCode.PRIMARY_KEY_ALREADY_PRESENT
        )
      })

      test(`${permission} key: delete index`, async () => {
        await client.createIndex(indexNoPk.uid)
        const response=await client.deleteIndex(indexNoPk.uid)
        expect(response).toBe(undefined)
        await expect(client.getIndexes()).resolves.toHaveLength(0)
      })

      test(`${permission} key: create index with already existing uid should fail`, async () => {
        await client.createIndex(indexPk.uid)
        await expect(client.createIndex(indexPk.uid)).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INDEX_ALREADY_EXISTS
        )
      })

      test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
        const index = client.index(indexNoPk.uid)
        await expect(index.delete()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INDEX_NOT_FOUND
        )
      })
      test(`${permission} key: delete index if exists on existing index`, async () => {
        await client.createIndex(indexPk.uid)
        const response=await client
          .deleteIndexIfExists(indexPk.uid)
          expect(response).toBe(true)
        await expect(client.getIndex(indexPk.uid)).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INDEX_NOT_FOUND
        )
      })

      test(`${permission} key: delete index if exists on index that does not exist`, async () => {
        const indexes = await client.getIndexes()
        const response=await client
          .deleteIndexIfExists('badIndex')
           expect(response).toBe(false)
        await expect(client.getIndex('badIndex')).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INDEX_NOT_FOUND
        )
        await expect(client.getIndexes()).resolves.toHaveLength(indexes.length)
      })

      test(`${permission} key: fetch deleted index should fail`, async () => {
        const index = client.index(indexPk.uid)
        await expect(index.getRawInfo()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INDEX_NOT_FOUND
        )
      })
    })

    describe('Test on base routes', () => {
      test(`${permission} key: get health`, async () => {
        const response=await client.health()
        expect(response).toHaveProperty(
          'status',
          expect.stringMatching('available')
        )
      })

      test(`${permission} key: is server healthy`, async () => {
        const response=await client.isHealthy()
        expect(response).toBe(true)
      })

      test(`${permission} key: is healthy return false on bad host`, async () => {
        const client = new MeiliSearch({ host: 'http://localhost:9345' })
        const response=await client.isHealthy()
        expect(response).toBe(false)
      })

      test(`${permission} key: get version`, async () => {
        const response=await client.getVersion()
        expect(response).toHaveProperty('commitSha', expect.any(String))
          expect(response).toHaveProperty('commitDate', expect.any(String))
          expect(response).toHaveProperty('pkgVersion', expect.any(String))
      })

      test(`${permission} key: get /stats information`, async () => {
        const response=await client.getStats()
        expect(response).toHaveProperty('databaseSize', expect.any(Number))
          expect(response).toHaveProperty('lastUpdate') // TODO: Could be null, find out why
          expect(response).toHaveProperty('indexes', expect.any(Object))
      })
    })
  }
)

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on misc client methods w/ public apikey',
  ({ client, permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    describe('Test on indexes methods', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
      })

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
      })
    })

    describe('Test on misc client methods', () => {
      test(`${permission} key: get health`, async () => {
        const response=await client.health()
        expect(response).toHaveProperty(
          'status',
          expect.stringMatching('available')
        )
      })

      test(`${permission} key: try to get version and be denied`, async () => {
        await expect(client.getVersion()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        await expect(client.getStats()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to create dumps and be denir`, async () => {
        await expect(client.createDump()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INVALID_TOKEN
        )
      })

      test(`${permission} key: try to create dumps and be denied`, async () => {
        await expect(client.getDumpStatus('test')).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.INVALID_TOKEN
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
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to delete index and be denied`, async () => {
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to update index and be denied`, async () => {
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
    })

    describe('Test on misc client methods', () => {
      test(`${permission} key: get health`, async () => {
        const response=await client.health()
        expect(response).toHaveProperty(
          'status',
          expect.stringMatching('available')
        )
      })

      test(`${permission} key: try to get version and be denied`, async () => {
        await expect(client.getVersion()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        await expect(client.getStats()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create dumps and be denir`, async () => {
        await expect(client.createDump()).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create dumps and be denied`, async () => {
        await expect(client.getDumpStatus('test')).rejects.toHaveProperty(
          'errorCode',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test createIndex route`, async () => {
    const route = `indexes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.createIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.updateIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test deleteIndex route`, async () => {
    const route = `indexes/${indexPk.uid}`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getIndexes route`, async () => {
    const route = `indexes`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getIndexes()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getKeys route`, async () => {
    const route = `keys`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getKeys()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test health route`, async () => {
    const route = `health`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.health()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test stats route`, async () => {
    const route = `stats`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getStats()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test version route`, async () => {
    const route = `version`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getVersion()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test createDump route`, async () => {
    const route = `dumps`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.createDump()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getDumpStatus route`, async () => {
    const route = `dumps/1/status`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.getDumpStatus('1')).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
