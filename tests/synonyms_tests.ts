import { ErrorStatusCode, EnqueuedTask } from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  BAD_HOST,
  MeiliSearch,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

const dataset = [
  { id: 123, title: 'Pride and Prejudice', comment: 'A great book' },
  { id: 456, title: 'Le Petit Prince', comment: 'A french book' },
  { id: 2, title: 'Le Rouge et le Noir', comment: 'Another french book' },
  { id: 1, title: 'Alice In Wonderland', comment: 'A weird book' },
  { id: 1344, title: 'The Hobbit', comment: 'An awesome book' },
  {
    id: 4,
    title: 'Harry Potter and the Half-Blood Prince',
    comment: 'The best book',
  },
  { id: 42, title: "The Hitchhiker's Guide to the Galaxy" },
]

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on synonyms', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default synonyms`, async () => {
    const response: object = await client.index(index.uid).getSynonyms()
    expect(response).toEqual({})
  })
  test(`${permission} key: Update synonyms`, async () => {
    const newSynonyms = {
      hp: ['harry potter'],
    }
    const synonyms: EnqueuedTask = await client
      .index(index.uid)
      .updateSynonyms(newSynonyms)
    expect(synonyms).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(synonyms.updateId)

    const response: object = await client.index(index.uid).getSynonyms()
    expect(response).toEqual(newSynonyms)
  })

  test(`${permission} key: Update synonyms with null value`, async () => {
    const newSynonyms = null
    const synonyms: EnqueuedTask = await client
      .index(index.uid)
      .updateSynonyms(newSynonyms)
    expect(synonyms).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(synonyms.updateId)

    const response: object = await client.index(index.uid).getSynonyms()
    expect(response).toEqual({})
  })

  test(`${permission} key: Reset synonyms`, async () => {
    const synonyms: EnqueuedTask = await client.index(index.uid).resetSynonyms()
    expect(synonyms).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(synonyms.updateId)

    const response: object = await client.index(index.uid).getSynonyms()
    expect(response).toEqual({})
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on synonyms',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).getSynonyms()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSynonyms({})
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSynonyms()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on synonyms',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).getSynonyms()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSynonyms({})
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset synonyms and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSynonyms()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getSynonyms()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateSynonyms({})
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetSynonyms route`, async () => {
    const route = `indexes/${index.uid}/settings/synonyms`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetSynonyms()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
