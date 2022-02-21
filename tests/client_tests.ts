import {
  IndexResponse,
  ErrorStatusCode,
  Health,
  Version,
  Stats,
  TaskStatus,
} from '../src/'
import {
  clearAllIndexes,
  getKey,
  getClient,
  config,
  MeiliSearch,
  MASTER_KEY,
  BAD_HOST,
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

describe.skip('Tests on client methods w/ master key', () => {
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
  { permission: 'Master' },
  { permission: 'Private' },
  { permission: 'Public' },
])('Test on client instance', ({ permission }) => {
  beforeEach(() => {
    return clearAllIndexes(config)
  })

  test(`${permission} key: Create client with api key`, async () => {
    const key = await getKey(permission)
    const client = new MeiliSearch({
      ...config,
      apiKey: key,
    })
    const health = await client.isHealthy()
    expect(health).toBe(true)
  })

  test(`${permission} key: Create client with custom headers`, async () => {
    const key = await getKey(permission)
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
    const key = await getKey(permission)
    try {
      const customHost = `${BAD_HOST}/api/`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}/api/health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: No double slash when on host with domain and path and no trailing slash`, async () => {
    const key = await getKey(permission)
    try {
      const customHost = `${BAD_HOST}/api`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}/api/health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: host with double slash should keep double slash`, async () => {
    const key = await getKey(permission)
    try {
      const customHost = `${BAD_HOST}//`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}//health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: host with one slash should not double slash`, async () => {
    const key = await getKey(permission)
    try {
      const customHost = `${BAD_HOST}/`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
    } catch (e: any) {
      expect(e.message).toMatch(`${BAD_HOST}/health`)
      expect(e.type).toBe('MeiliSearchCommunicationError')
    }
  })

  test(`${permission} key: bad host raise CommunicationError`, async () => {
    const client = new MeiliSearch({ host: 'http://localhost:9345' })
    try {
      await client.health()
    } catch (e: any) {
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

  test.only(`${permission} key: generate a tenant token`, async () => {
    const client = new MeiliSearch({ host: 'meilisearch' })
    const token = await client.generateTenantToken()
    console.log(token)
  })
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on client w/ master and admin key',
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    test(`${permission} key: Create client with custom headers`, async () => {
      const key = await getKey(permission)
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
      const status = await client.createIndex('test')
      await client.waitForTask(status.uid)
      const indexes = await client.getIndexes()
      expect(indexes.length).toBe(1)
    })

    describe('Test on indexes methods', () => {
      test(`${permission} key: create with no primary key`, async () => {
        const client = await getClient(permission)

        const task = await client.createIndex(indexNoPk.uid)
        await client.waitForTask(task.uid)
        const newIndex = await client.getIndex(indexNoPk.uid)
        expect(newIndex).toHaveProperty('uid', indexNoPk.uid)
        expect(newIndex).toHaveProperty('primaryKey', null)

        const rawIndex = await client.index(indexNoPk.uid).getRawInfo()
        expect(rawIndex).toHaveProperty('uid', indexNoPk.uid)
        expect(rawIndex).toHaveProperty('primaryKey', null)
        expect(rawIndex).toHaveProperty('createdAt', expect.any(String))
        expect(rawIndex).toHaveProperty('updatedAt', expect.any(String))

        const response = await client.getIndex(indexNoPk.uid)
        expect(response.primaryKey).toBe(null)
        expect(response.uid).toBe(indexNoPk.uid)
      })

      test(`${permission} key: create with primary key`, async () => {
        const client = await getClient(permission)

        const { uid } = await client.createIndex(indexPk.uid, {
          primaryKey: indexPk.primaryKey,
        })
        await client.waitForTask(uid)
        const newIndex = await client.getIndex(indexPk.uid)

        expect(newIndex).toHaveProperty('uid', indexPk.uid)
        expect(newIndex).toHaveProperty('primaryKey', indexPk.primaryKey)

        const rawIndex = await client.index(indexPk.uid).getRawInfo()
        expect(rawIndex).toHaveProperty('primaryKey', indexPk.primaryKey)
        expect(rawIndex).toHaveProperty('createdAt', expect.any(String))
        expect(rawIndex).toHaveProperty('updatedAt', expect.any(String))

        const response = await client.getIndex(indexPk.uid)
        expect(response.primaryKey).toBe(indexPk.primaryKey)
        expect(response.uid).toBe(indexPk.uid)
      })

      test(`${permission} key: get all indexes when not empty`, async () => {
        const client = await getClient(permission)

        const { uid } = await client.createIndex(indexPk.uid)
        await client.waitForTask(uid)

        const response: IndexResponse[] = await client.getIndexes()
        const indexes = response.map((index) => index.uid)
        expect(indexes).toEqual(expect.arrayContaining([indexPk.uid]))
        expect(indexes.length).toEqual(1)
      })

      test(`${permission} key: Get index that exists`, async () => {
        const client = await getClient(permission)

        const { uid } = await client.createIndex(indexPk.uid)
        await client.waitForTask(uid)

        const response = await client.getIndex(indexPk.uid)
        expect(response).toHaveProperty('uid', indexPk.uid)
      })

      test(`${permission} key: Get index that does not exist`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndex('does_not_exist')).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INDEX_NOT_FOUND
        )
      })

      test(`${permission} key: update primary key`, async () => {
        const client = await getClient(permission)
        const { uid: createTask } = await client.createIndex(indexPk.uid)
        await client.waitForTask(createTask)

        const { uid: updateTask } = await client.updateIndex(indexPk.uid, {
          primaryKey: 'newPrimaryKey',
        })
        await client.waitForTask(updateTask)

        const index = await client.getIndex(indexPk.uid)

        expect(index).toHaveProperty('uid', indexPk.uid)
        expect(index).toHaveProperty('primaryKey', 'newPrimaryKey')
      })

      test(`${permission} key: update primary key that already exists`, async () => {
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

      test(`${permission} key: delete index`, async () => {
        const client = await getClient(permission)
        const { uid: createTask } = await client.createIndex(indexNoPk.uid)
        await client.waitForTask(createTask)

        const { uid: deleteTask } = await client.deleteIndex(indexNoPk.uid)
        const task = await client.waitForTask(deleteTask)
        expect(task.status).toBe(TaskStatus.TASK_SUCCEEDED)

        await expect(client.getIndexes()).resolves.toHaveLength(0)
      })

      test(`${permission} key: create index with already existing uid should fail`, async () => {
        const client = await getClient(permission)
        const { uid: firstCreate } = await client.createIndex(indexPk.uid)
        await client.waitForTask(firstCreate)

        const { uid: secondCreate } = await client.createIndex(indexPk.uid)
        const task = await client.waitForTask(secondCreate)
        expect(task.status).toBe('failed')
      })

      test(`${permission} key: delete index with uid that does not exist should fail`, async () => {
        const client = await getClient(permission)
        const index = client.index(indexNoPk.uid)
        const { uid } = await index.delete()
        const task = await client.waitForTask(uid)
        expect(task.status).toEqual('failed')
      })

      test(`${permission} key: fetch deleted index should fail`, async () => {
        const client = await getClient(permission)
        const index = client.index(indexPk.uid)
        await expect(index.getRawInfo()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INDEX_NOT_FOUND
        )
      })
    })

    describe('Test on base routes', () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission)
        const response: Health = await client.health()
        expect(response).toHaveProperty(
          'status',
          expect.stringMatching('available')
        )
      })

      test(`${permission} key: is server healthy`, async () => {
        const client = await getClient(permission)
        const response: boolean = await client.isHealthy()
        expect(response).toBe(true)
      })

      test(`${permission} key: is healthy return false on bad host`, async () => {
        const client = new MeiliSearch({ host: 'http://localhost:9345' })
        const response: boolean = await client.isHealthy()
        expect(response).toBe(false)
      })

      test(`${permission} key: get version`, async () => {
        const client = await getClient(permission)
        const response: Version = await client.getVersion()
        expect(response).toHaveProperty('commitSha', expect.any(String))
        expect(response).toHaveProperty('commitDate', expect.any(String))
        expect(response).toHaveProperty('pkgVersion', expect.any(String))
      })

      test(`${permission} key: get /stats information`, async () => {
        const client = await getClient(permission)
        const response: Stats = await client.getStats()
        expect(response).toHaveProperty('databaseSize', expect.any(Number))
        expect(response).toHaveProperty('lastUpdate') // TODO: Could be null, find out why
        expect(response).toHaveProperty('indexes', expect.any(Object))
      })
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on misc client methods w/ search apikey',
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    describe('Test on indexes methods', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: try to delete index and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: try to update index and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
      })
    })

    describe('Test on misc client methods', () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission)
        const response: Health = await client.health()
        expect(response).toHaveProperty(
          'status',
          expect.stringMatching('available')
        )
      })

      test(`${permission} key: try to get version and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getVersion()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getStats()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: try to create dumps and be denir`, async () => {
        const client = await getClient(permission)
        await expect(client.createDump()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })

      test(`${permission} key: try to create dumps and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getDumpStatus('test')).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.INVALID_API_KEY
        )
      })
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on misc client methods w/ no apiKey client',
  ({ permission }) => {
    beforeEach(() => {
      return clearAllIndexes(config)
    })

    describe('Test on indexes methods', () => {
      test(`${permission} key: try to get all indexes and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getIndexes()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create Index with primary key and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.createIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create Index with NO primary key and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.createIndex(indexNoPk.uid)).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to delete index and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.deleteIndex(indexPk.uid)).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to update index and be denied`, async () => {
        const client = await getClient(permission)
        await expect(
          client.updateIndex(indexPk.uid, {
            primaryKey: indexPk.primaryKey,
          })
        ).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })
    })

    describe('Test on misc client methods', () => {
      test(`${permission} key: get health`, async () => {
        const client = await getClient(permission)
        const response: Health = await client.health()
        expect(response).toHaveProperty(
          'status',
          expect.stringMatching('available')
        )
      })

      test(`${permission} key: try to get version and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getVersion()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to get /stats information and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getStats()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create dumps and be denir`, async () => {
        const client = await getClient(permission)
        await expect(client.createDump()).rejects.toHaveProperty(
          'code',
          ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
        )
      })

      test(`${permission} key: try to create dumps and be denied`, async () => {
        const client = await getClient(permission)
        await expect(client.getDumpStatus('test')).rejects.toHaveProperty(
          'code',
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
