import {
  getClient,
  decode64,
  getKey,
  dataset,
  clearAllIndexes,
  config,
  HOST,
} from './utils/meilisearch-test-utils'
import crypto from 'crypto'
import MeiliSearch from '../src'

const HASH_ALGORITHM = 'HS256'
const TOKEN_TYP = 'JWT'
const UID = 'movies_test'

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Private' }])(
  'Tests on token generation',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      await client.index(UID).delete()
      const { taskUid } = await client.index(UID).addDocuments(dataset)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: create a tenant token and test header`, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken([])
      const [header64] = token.split('.')

      // header
      const { typ, alg } = JSON.parse(decode64(header64))
      expect(alg).toEqual(HASH_ALGORITHM)
      expect(typ).toEqual(TOKEN_TYP)
    })

    test(`${permission} key: create a tenant token and test signature`, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken([])
      const apiKey = await getKey(permission)
      const [header64, payload64, signature64] = token.split('.')

      // signature
      const newSignature = crypto
        .createHmac('sha256', apiKey)
        .update(`${header64}.${payload64}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      expect(signature64).toEqual(newSignature)
    })

    test(`${permission} key: create a tenant token with default values and test payload`, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken([])
      const apiKey = await getKey(permission)
      const [_, payload64] = token.split('.')

      // payload
      const { apiKeyPrefix, exp, searchRules } = JSON.parse(decode64(payload64))
      expect(apiKeyPrefix).toEqual(apiKey.substring(0, 8))
      expect(exp).toBeUndefined()
      expect(searchRules).toEqual([])
    })

    test(`${permission} key: create a tenant token with array searchRules and test payload`, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken([UID])
      const apiKey = await getKey(permission)
      const [_, payload64] = token.split('.')

      // payload
      const { apiKeyPrefix, exp, searchRules } = JSON.parse(decode64(payload64))
      expect(apiKeyPrefix).toEqual(apiKey.substring(0, 8))
      expect(exp).toBeUndefined()
      expect(searchRules).toEqual([UID])
    })

    test(`${permission} key: create a tenant token with oject search rules and test payload`, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken({ [UID]: {} })
      const apiKey = await getKey(permission)
      const [_, payload64] = token.split('.')

      // payload
      const { apiKeyPrefix, exp, searchRules } = JSON.parse(decode64(payload64))
      expect(apiKeyPrefix).toEqual(apiKey.substring(0, 8))
      expect(exp).toBeUndefined()
      expect(searchRules).toEqual({ [UID]: {} })
    })

    test(`${permission} key: Search in tenant token with wildcard`, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken(['*'])

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      expect(searchClient.index(UID).search()).resolves.not.toBeUndefined()
    })

    test(`${permission} key: Search in tenant token with custom api key`, async () => {
      // add filterable
      const masterClient = await getClient('master')
      const { key } = await masterClient.createKey({
        expiresAt: null,
        description: 'Custom key',
        actions: ['search'],
        indexes: [UID],
      })

      const client = await getClient(permission)
      const token = client.generateTenantToken(['*'], { apiKey: key })

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      expect(searchClient.index(UID).search()).resolves.not.toBeUndefined()
    })

    test(`${permission} key: create a tenant token no api key and test payload`, () => {
      const client = new MeiliSearch({ host: HOST })
      // Needs to be wrapped in a function for it to work.
      expect(() => client.generateTenantToken([])).toThrow()
    })

    test(`${permission} key: Search in tenant token with expireAt`, async () => {
      const client = await getClient(permission)
      const date = new Date('December 17, 4000 03:24:00')
      const token = client.generateTenantToken(['*'], {
        expiresAt: date,
      })

      const [_, payload] = token.split('.')
      expect(JSON.parse(decode64(payload)).exp).toEqual(date.getTime())

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      expect(searchClient.index(UID).search()).resolves.not.toBeUndefined()
    })

    test(`${permission} key: Search in tenant token with expireAt value set in the past`, async () => {
      const client = await getClient(permission)
      const date = new Date('December 17, 2000 03:24:00')
      expect(() =>
        client.generateTenantToken(['*'], {
          expiresAt: date,
        })
      ).toThrow()
    })

    test(`${permission} key: Search in tenant token with specific index set to null`, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken({
        [UID]: null,
      })
      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      expect(searchClient.index(UID).search()).resolves.not.toBeUndefined()
    })

    test(`${permission} key: Search in tenant token with specific index and specific rules`, async () => {
      // add filterable
      const masterClient = await getClient('master')
      const { taskUid } = await masterClient
        .index(UID)
        .updateFilterableAttributes(['id'])
      await masterClient.waitForTask(taskUid)

      const client = await getClient(permission)
      const token = client.generateTenantToken({
        [UID]: { filter: 'id = 2' },
      })
      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      expect(searchClient.index(UID).search()).resolves.not.toBeUndefined()
    })

    test(`${permission} key: Search in tenant token with empty array `, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken([])

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      await expect(
        searchClient.index(UID).search('pride')
      ).rejects.toHaveProperty('code', 'invalid_api_key')
    })

    test(`${permission} key: Search in tenant token on index with no permissions `, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken({ misc: null })

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      await expect(
        searchClient.index(UID).search('pride')
      ).rejects.toHaveProperty('code', 'invalid_api_key')
    })
  }
)
