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
import { MeiliSearchError } from '../src/errors'

const HASH_ALGORITHM = 'HS256'
const TOKEN_TYP = 'JWT'
const UID = 'movies_test'

afterAll(() => {
  clearAllIndexes(config)
})

describe.each([{ permission: 'Private' }])(
  'Tests on token generation',
  ({ permission }) => {
    beforeEach(async () => {
      const client = await getClient('Master')
      await client.index(UID).delete()
      const { taskUid } = await client.index(UID).addDocuments(dataset)
      await client.waitForTask(taskUid)

      const keys = await client.getKeys()

      const customKeys = keys.results.filter(
        (key) =>
          key.name !== 'Default Search API Key' &&
          key.name !== 'Default Admin API Key'
      )

      // Delete all custom keys
      await Promise.all(customKeys.map((key) => client.deleteKey(key.uid)))
    })

    test(`${permission} key: create a tenant token and test header`, async () => {
      const client = await getClient(permission)
      const apiKey = await getKey(permission)
      const { uid } = await client.getKey(apiKey)
      const token = client.generateTenantToken([], { uid })
      const [header64] = token.split('.')

      // header
      const { typ, alg } = JSON.parse(decode64(header64))
      expect(alg).toEqual(HASH_ALGORITHM)
      expect(typ).toEqual(TOKEN_TYP)
    })

    test(`${permission} key: create a tenant token and test signature`, async () => {
      const client = await getClient(permission)
      const apiKey = await getKey(permission)
      const { uid } = await client.getKey(apiKey)
      const token = client.generateTenantToken([], { uid })
      const [header64, payload64, signature64] = token.split('.')

      // signature
      const newSignature = crypto
        .createHmac('sha256', uid)
        .update(`${header64}.${payload64}`)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')

      expect(signature64).toEqual(newSignature)
    })

    test(`${permission} key: create a tenant token with default values and test payload`, async () => {
      const client = await getClient(permission)
      const apiKey = await getKey(permission)
      const { uid } = await client.getKey(apiKey)
      const token = client.generateTenantToken([], { uid })
      const [_, payload64] = token.split('.')

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(decode64(payload64))

      expect(apiKeyUid).toEqual(uid)
      expect(exp).toBeUndefined()
      expect(searchRules).toEqual([])
    })

    test(`${permission} key: create a tenant token with array searchRules and test payload`, async () => {
      const client = await getClient(permission)
      const apiKey = await getKey(permission)
      const { uid } = await client.getKey(apiKey)
      const token = client.generateTenantToken([UID], { uid })
      const [_, payload64] = token.split('.')

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(decode64(payload64))

      expect(apiKeyUid).toEqual(uid)
      expect(exp).toBeUndefined()
      expect(searchRules).toEqual([UID])
    })

    test(`${permission} key: create a tenant token with oject search rules and test payload`, async () => {
      const client = await getClient(permission)
      const apiKey = await getKey(permission)
      const { uid } = await client.getKey(apiKey)
      const token = client.generateTenantToken({ [UID]: {} }, { uid })
      const [_, payload64] = token.split('.')

      // payload
      const { apiKeyUid, exp, searchRules } = JSON.parse(decode64(payload64))
      expect(apiKeyUid).toEqual(uid)
      expect(exp).toBeUndefined()
      expect(searchRules).toEqual({ [UID]: {} })
    })

    test.only(`${permission} key: Search in tenant token with wildcard`, async () => {
      const client = await getClient(permission)
      const apiKey = await getKey(permission)
      const key = await client.getKey(apiKey)
      console.log({ key })

      const token = client.generateTenantToken(['*'], { uid: key.uid })

      // console.log({ key })

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })
      const res = await searchClient.index(UID).search()

      // search
      expect(res).resolves.not.toBeUndefined()
    })

    // TODO: not sure why it does not work anymore
    test.skip(`${permission} key: Search in tenant token with custom api key`, async () => {
      const masterClient = await getClient('master')
      const key = await masterClient.createKey({
        expiresAt: null,
        description: 'Custom key',
        actions: ['search'],
        indexes: [UID],
      })

      // console.log({ key })

      const client = await getClient(permission)
      const token = client.generateTenantToken(['*'], { uid: key.uid })

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      const response = await searchClient.index(UID).search()
      expect(response).resolves.toBeDefined()
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

    test(`${permission} key: Search in tenant token on index with no permissions `, async () => {
      const client = await getClient(permission)
      const token = client.generateTenantToken({ misc: null })

      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })

      // search
      await expect(
        searchClient.index(UID).search('pride')
      ).rejects.toHaveProperty('code', 'invalid_api_key')
    })

    test.only(`${permission} key: Search in tenant token with `, async () => {
      const client = await getClient(permission)
      const key = await getKey('Private')
      const { uid } = await client.getKey(key)

      const token = client.generateTenantToken(
        {},
        {
          uid: uid,
        }
      )
      console.log({ token })
      const searchClient = new MeiliSearch({ host: HOST, apiKey: token })
      const res = await searchClient.index(UID).search('pride')
    })

    test(`${permission} key: Search in tenant token on index with no permissions `, async () => {
      const client = await getClient(permission)
      const date = new Date('December 17, 2000 03:24:00')
      expect(() =>
        client.generateTenantToken(
          {},
          {
            expiresAt: date,
          }
        )
      ).toThrowError(
        new MeiliSearchError(
          `Meilisearch: When the expiresAt field in the token generation has a value, it must be a date set in the future and not in the past. \n`
        )
      )
    })
  }
)
