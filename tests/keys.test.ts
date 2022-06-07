import { ErrorStatusCode, Key } from '../src/types'
import {
  clearAllIndexes,
  config,
  getClient,
  getKey,
} from './utils/meilisearch-test-utils'

beforeEach(async () => {
  await clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }])('Test on keys', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })
  test(`${permission} key: get keys`, async () => {
    const client = await getClient(permission)
    const { results: keys } = await client.getKeys()

    const defaultKey = keys.find((key: Key) =>
      key.description.startsWith('Default Search API')
    )

    expect(defaultKey).toBeDefined()
    expect(defaultKey).toHaveProperty(
      'description',
      'Default Search API Key (Use it to search from the frontend)'
    )
    expect(defaultKey).toHaveProperty('key')
    expect(defaultKey).toHaveProperty('actions')
    expect(defaultKey).toHaveProperty('indexes')
    expect(defaultKey).toHaveProperty('expiresAt', null)
    expect(defaultKey).toHaveProperty('createdAt')
    expect(defaultKey).toHaveProperty('updatedAt')

    const adminKey = keys.find((key: Key) =>
      key.description.startsWith('Default Admin API Key')
    )

    expect(adminKey).toBeDefined()
    expect(adminKey).toHaveProperty(
      'description',
      'Default Admin API Key (Use it for all other operations. Caution! Do not use it on a public frontend)'
    )
    expect(adminKey).toHaveProperty('key')
    expect(adminKey).toHaveProperty('actions')
    expect(adminKey).toHaveProperty('indexes')
    expect(adminKey).toHaveProperty('expiresAt', null)
    expect(adminKey).toHaveProperty('createdAt')
    expect(adminKey).toHaveProperty('updatedAt')
  })

  test(`${permission} key: get on key`, async () => {
    const client = await getClient(permission)
    const apiKey = await getKey('Private')

    const key = await client.getKey(apiKey)

    expect(key).toBeDefined()
    expect(key).toHaveProperty(
      'description',
      'Default Admin API Key (Use it for all other operations. Caution! Do not use it on a public frontend)'
    )
    expect(key).toHaveProperty('key')
    expect(key).toHaveProperty('actions')
    expect(key).toHaveProperty('indexes')
    expect(key).toHaveProperty('expiresAt', null)
    expect(key).toHaveProperty('createdAt')
    expect(key).toHaveProperty('updatedAt')
  })

  test(`${permission} key: create key with no expiresAt`, async () => {
    const client = await getClient(permission)

    const key = await client.createKey({
      description: 'Indexing Products API key',
      actions: ['documents.add'],
      indexes: ['products'],
      expiresAt: null,
    })

    expect(key).toBeDefined()
    expect(key).toHaveProperty('description', 'Indexing Products API key')
    expect(key).toHaveProperty('key')
    expect(key).toHaveProperty('actions')
    expect(key).toHaveProperty('indexes')
    expect(key).toHaveProperty('expiresAt', null)
    expect(key).toHaveProperty('createdAt')
    expect(key).toHaveProperty('updatedAt')
  })

  test(`${permission} key: create key with an expiresAt`, async () => {
    const client = await getClient(permission)

    const key = await client.createKey({
      description: 'Indexing Products API key',
      actions: ['documents.add'],
      indexes: ['products'],
      expiresAt: '2050-11-13T00:00:00Z', // Test will fail in 2050
    })

    expect(key).toBeDefined()
    expect(key).toHaveProperty('description', 'Indexing Products API key')
    expect(key).toHaveProperty('key')
    expect(key).toHaveProperty('actions', ['documents.add'])
    expect(key).toHaveProperty('indexes')
    expect(key).toHaveProperty('expiresAt', '2050-11-13T00:00:00Z')
    expect(key).toHaveProperty('createdAt')
    expect(key).toHaveProperty('updatedAt')
  })

  test(`${permission} key: update a key`, async () => {
    const client = await getClient(permission)

    const key = await client.createKey({
      description: 'Indexing Products API key',
      actions: ['documents.add'],
      indexes: ['products'],
      expiresAt: '2050-11-13T00:00:00Z', // Test will fail in 2050
    })

    const updatedKey = await client.updateKey(key.key, {
      description: 'Indexing Products API key',
      actions: ['documents.add'],
      indexes: ['products'],
      expiresAt: '2050-11-13T00:00:00Z', // Test will fail in 2050
    })

    expect(updatedKey).toBeDefined()
    expect(updatedKey).toHaveProperty(
      'description',
      'Indexing Products API key'
    )
    expect(updatedKey).toHaveProperty('key')
    expect(updatedKey).toHaveProperty('actions')
    expect(updatedKey).toHaveProperty('indexes')
    expect(updatedKey).toHaveProperty('expiresAt', '2050-11-13T00:00:00Z')
    expect(updatedKey).toHaveProperty('createdAt')
    expect(updatedKey).toHaveProperty('updatedAt')
  })

  test(`${permission} key: delete a key`, async () => {
    const client = await getClient(permission)

    const key = await client.createKey({
      description: 'Indexing Products API key',
      actions: ['documents.add'],
      indexes: ['products'],
      expiresAt: '2050-11-13T00:00:00Z', // Test will fail in 2050
    })

    const deletedKey = await client.deleteKey(key.key)
    expect(deletedKey).toBeUndefined()
  })
})

describe.each([{ permission: 'Private' }])(
  'Test on keys with admin key',
  ({ permission }) => {
    test(`${permission} key: get keys denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getKeys()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })

    test(`${permission} key: create key denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.createKey({
          description: 'Indexing Products API key',
          actions: ['documents.add'],
          indexes: ['products'],
          expiresAt: null,
        })
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)
describe.each([{ permission: 'Public' }])(
  'Test on keys with search key',
  ({ permission }) => {
    test(`${permission} key: get keys denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getKeys()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })

    test(`${permission} key: create key denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.createKey({
          description: 'Indexing Products API key',
          actions: ['documents.add'],
          indexes: ['products'],
          expiresAt: null,
        })
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on keys with No key',
  ({ permission }) => {
    test(`${permission} key: get keys denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getKeys()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: create key denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.createKey({
          description: 'Indexing Products API key',
          actions: ['documents.add'],
          indexes: ['products'],
          expiresAt: null,
        })
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)
