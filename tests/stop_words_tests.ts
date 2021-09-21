import { ErrorStatusCode, EnqueuedUpdate } from '../src/types'
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
])('Test on stop words', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get default stop words`, async () => {
    await client
      .index(index.uid)
      .getStopWords()
      .then((response: string[]) => {
        expect(response).toEqual([])
      })
  })

  test(`${permission} key: Update stop words`, async () => {
    const newStopWords = ['the']
    const { updateId } = await client
      .index(index.uid)
      .updateStopWords(newStopWords)
      .then((response: EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getStopWords()
      .then((response: string[]) => {
        expect(response).toEqual(newStopWords)
      })
  })

  test(`${permission} key: Update stop words with null value`, async () => {
    const newStopWords = null
    const { updateId } = await client
      .index(index.uid)
      .updateStopWords(newStopWords)
      .then((response: EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getStopWords()
      .then((response: string[]) => {
        expect(response).toEqual([])
      })
  })

  test(`${permission} key: Reset stop words`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetStopWords()
      .then((response: EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getStopWords()
      .then((response: string[]) => {
        expect(response).toEqual([])
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on stop words',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).getStopWords()
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to update stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).updateStopWords([])
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })

    test(`${permission} key: try to reset stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).resetStopWords()
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on stop words',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).getStopWords()
      ).rejects.toHaveProperty(
        'errorCode',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).updateStopWords([])
      ).rejects.toHaveProperty(
        'errorCode',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset stop words and be denied`, async () => {
      await expect(
        client.index(index.uid).resetStopWords()
      ).rejects.toHaveProperty(
        'errorCode',
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
  test(`Test getStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getStopWords()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateStopWords([])
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetStopWords route`, async () => {
    const route = `indexes/${index.uid}/settings/stop-words`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetStopWords()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
