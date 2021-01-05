import {
  clearAllIndexes,
  config,
  PUBLIC_KEY,
  MeiliSearch,
  MASTER_KEY,
  PRIVATE_KEY,
  BAD_HOST,
} from './meilisearch-test-utils'

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { key: MASTER_KEY, permission: 'Master' },
  { key: PRIVATE_KEY, permission: 'Private' },
  { key: PUBLIC_KEY, permission: 'Public' },
])('Test on client', ({ key, permission }) => {
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

  test(`${permission} key: Client handles host URL with domain and path`, () => {
    const customHost = `${config.host}/api`
    const client = new MeiliSearch({
      host: customHost,
      apiKey: key,
    })
    expect(client.config.host).toBe(customHost)
    expect(client.httpRequest.url).toBe(customHost)
  })
  test(`${permission} key: No double slash when on host with domain and path`, async () => {
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

  test(`${permission} key: host with double slash should not double slash`, async () => {
    try {
      const customHost = `${BAD_HOST}//`
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

  test(`${permission} key: Client uses complete URL with domain and additionnal path in MeiliSearch call`, async () => {
    try {
      const customHost = `${config.host}/api`
      const client = new MeiliSearch({
        host: customHost,
        apiKey: key,
      })
      const health = await client.isHealthy()
      expect(health).toBe(false) // Left here to trigger failed test if error is not thrown
      await client.listIndexes()
    } catch (e) {
      expect(e.type).toBe('MeiliSearchCommunicationError')
      expect(e.message).toBe('Not Found') // Expect 404 because host does not exist
    }
  })
})

describe.each([
  { key: MASTER_KEY, permission: 'Master' },
  { key: PRIVATE_KEY, permission: 'Private' },
])('Test on client', ({ key, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
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
