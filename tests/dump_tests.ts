import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
} from './meilisearch-test-utils'

beforeAll(async () => {
  await clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on dump', ({ client, permission }) => {
  test(`${permission} key: create a new dump`, async () => {
    await client.createDump().then((response) => {
      expect(response.uid).toBeDefined()
      expect(response.status).toEqual('processing')
    })
  })

  test(`${permission} key: get dump status`, async () => {
    const enqueuedDump = await client.createDump()
    await client.getDumpStatus(enqueuedDump.uid).then((response) => {
      expect(response.uid).toEqual(enqueuedDump.uid)
      expect(response.status).toBeDefined()
    })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on dump with public api key should not have access',
  ({ client, permission }) => {
    test(`${permission} key: try to create dump with public key and be denied`, async () => {
      await expect(client.createDump()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })

    test(`${permission} key: try to get dump status with public key and be denied`, async () => {
      await expect(client.getDumpStatus('dumpUid')).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INVALID_TOKEN
      )
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on dump without api key should not have access',
  ({ client, permission }) => {
    test(`${permission} key: try to create dump with no key and be denied`, async () => {
      await expect(client.createDump()).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to get dump status with no key and be denied`, async () => {
      await expect(client.getDumpStatus('dumpUid')).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)
