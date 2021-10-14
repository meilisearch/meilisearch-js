import { ErrorStatusCode, EnqueuedUpdate, Update } from '../src/types'
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
])('Test on updates', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
  })

  test(`${permission} key: Get one update`, async () => {
    const response: EnqueuedUpdate = await client
      .index(index.uid)
      .addDocuments(dataset)
    expect(response).toHaveProperty('updateId', expect.any(Number))
    await client.index(index.uid).waitForPendingUpdate(response.updateId)

    const stausReponse: Update = await client
      .index(index.uid)
      .getUpdateStatus(response.updateId)

    expect(stausReponse).toHaveProperty('status', 'processed')
    expect(stausReponse).toHaveProperty('updateId', expect.any(Number))
    expect(stausReponse).toHaveProperty('type', expect.any(Object))
    expect(stausReponse.type).toHaveProperty('name', 'DocumentsAddition')
    expect(stausReponse.type).toHaveProperty('number', 7)
    expect(stausReponse).toHaveProperty('duration', expect.any(Number))
    expect(stausReponse).toHaveProperty('enqueuedAt', expect.any(String))
    expect(stausReponse).toHaveProperty('processedAt', expect.any(String))
  })

  test(`${permission} key: Get all updates`, async () => {
    const { updateId } = await client.index(index.uid).addDocuments([{ id: 1 }])
    await client.index(index.uid).waitForPendingUpdate(updateId)

    const response: Update[] = await client
      .index(index.uid)
      .getAllUpdateStatus()
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

  test(`${permission} key: Try to get update that does not exist`, async () => {
    await expect(
      client.index(index.uid).getUpdateStatus(2545)
    ).rejects.toHaveProperty('errorCode', ErrorStatusCode.NOT_FOUND)
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
      ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INVALID_TOKEN)
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
  test(`Test getUpdateStatus route`, async () => {
    const route = `indexes/${index.uid}/updates/1`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getUpdateStatus(1)
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test getAllUpdateStatus route`, async () => {
    const route = `indexes/${index.uid}/updates`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getAllUpdateStatus()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
