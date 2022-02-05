import { ErrorStatusCode } from '../src/types'
import {
  clearAllIndexes,
  config,
  waitForDumpProcessing,
  MeiliSearch,
  BAD_HOST,
  getClient,
} from './meilisearch-test-utils'

beforeEach(async () => {
  await clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Test on dump',
  ({ permission }) => {
    test(`${permission} key: create a new dump`, async () => {
      const client = await getClient(permission)
      const response = await client.createDump()
      expect(response.uid).toBeDefined()
      expect(response.status).toEqual('in_progress')
      await waitForDumpProcessing(response.uid, client)
    })

    test(`${permission} key: get dump status`, async () => {
      const client = await getClient(permission)
      const enqueuedDump = await client.createDump()
      await waitForDumpProcessing(enqueuedDump.uid, client)
      const response = await client.getDumpStatus(enqueuedDump.uid)
      expect(response.uid).toEqual(enqueuedDump.uid)
      expect(response.status).toBeDefined()
      expect(response.startedAt).toBeDefined()
      expect(response.finishedAt).toBeDefined()
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Test on dump with search api key should not have access',
  ({ permission }) => {
    test(`${permission} key: try to create dump with search key and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.createDump()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })

    test(`${permission} key: try to get dump status with Search key and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getDumpStatus('dumpUid')).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.INVALID_API_KEY
      )
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Test on dump without api key should not have access',
  ({ permission }) => {
    test(`${permission} key: try to create dump with no key and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.createDump()).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get dump status with no key and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.getDumpStatus('dumpUid')).rejects.toHaveProperty(
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
