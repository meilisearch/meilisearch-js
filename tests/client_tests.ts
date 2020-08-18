import {
  clearAllIndexes,
  config,
  PUBLIC_KEY,
  MeiliSearch,
  MASTER_KEY,
  PRIVATE_KEY,
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
