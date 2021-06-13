import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  badHostClient,
  BAD_HOST,
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
])('Test on updates', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
  })

  test(`${permission} key: Get one update`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .addDocuments(dataset)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getUpdateStatus(updateId)
      .then((response: Types.Update) => {
        expect(response).toHaveProperty('status', 'processed')
        expect(response).toHaveProperty('updateId', expect.any(Number))
        expect(response).toHaveProperty('type', expect.any(Object))
        expect(response.type).toHaveProperty('name', 'DocumentsAddition')
        expect(response.type).toHaveProperty('number', 7)
        expect(response).toHaveProperty('duration', expect.any(Number))
        expect(response).toHaveProperty('enqueuedAt', expect.any(String))
        expect(response).toHaveProperty('processedAt', expect.any(String))
      })
  })

  test(`${permission} key: Get all updates`, async () => {
    const { updateId } = await client.index(index.uid).addDocuments([{ id: 1 }])
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getAllUpdateStatus()
      .then((response: Types.Update[]) => {
        expect(response.length).toEqual(1)
        expect(response[0]).toHaveProperty('status', 'processed')
        expect(response[0]).toHaveProperty('updateId', expect.any(Number))
        expect(response[0]).toHaveProperty('type', expect.any(Object))
        expect(response[0].type).toHaveProperty('name', 'DocumentsAddition')
        expect(response[0].type).toHaveProperty('number', 1)
        expect(response[0]).toHaveProperty('duration', expect.any(Number))
        expect(response[0]).toHaveProperty('enqueuedAt', expect.any(String))
        expect(response[0]).toHaveProperty('processedAt', expect.any(String))
      })
  })

  test(`${permission} key: Try to get update that does not exist`, async () => {
    await expect(
      client.index(index.uid).getUpdateStatus(2545)
    ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.NOT_FOUND)
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on updates',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: Try to get a update and be denied`, async () => {
      await expect(
        client.index(index.uid).getUpdateStatus(0)
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on updates',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: Try to get an update and be denied`, async () => {
      await expect(
        client.index(index.uid).getUpdateStatus(0)
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe('Tests on url construction', () => {
  test(`Test getUpdateStatus route`, async () => {
    const route = `indexes/${index.uid}/updates/1`
    await expect(
      badHostClient.index(index.uid).getUpdateStatus(1)
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getAllUpdateStatus route`, async () => {
    const route = `indexes/${index.uid}/updates`
    await expect(
      badHostClient.index(index.uid).getAllUpdateStatus()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
