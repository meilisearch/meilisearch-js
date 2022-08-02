import { ErrorStatusCode } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  dataset,
} from './utils/meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

const defaultTypoTolerance = {
  enabled: true,
  minWordSizeForTypos: {
    oneTypo: 5,
    twoTypos: 9,
  },
  disableOnWords: [],
  disableOnAttributes: [],
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Private' }])(
  'Tests on typo tolerance',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('master')
      const { taskUid } = await client.index(index.uid).addDocuments(dataset)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Get default typo tolerance settings`, async () => {
      const client = await getClient(permission)
      const response: string[] = await client
        .index(index.uid)
        .getTypoTolerance()
      expect(response).toEqual(defaultTypoTolerance)
    })

    test(`${permission} key: Update typo tolerance settings`, async () => {
      const client = await getClient(permission)
      const newTypoTolerance = {
        enabled: false,
        minWordSizeForTypos: {
          oneTypo: 1,
          twoTypos: 2,
        },
        disableOnWords: ['title'],
        disableOnAttributes: ['hello'],
      }
      const task = await client
        .index(index.uid)
        .updateTypoTolerance(newTypoTolerance)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response = await client.index(index.uid).getTypoTolerance()

      expect(response).toEqual(newTypoTolerance)
    })

    test(`${permission} key: Update typo tolerance using null as value`, async () => {
      const client = await getClient(permission)
      const task = await client.index(index.uid).updateTypoTolerance(null)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response = await client.index(index.uid).getTypoTolerance()

      expect(response).toEqual(defaultTypoTolerance)
    })

    test(`${permission} key: Reset typo tolerance settings`, async () => {
      const client = await getClient(permission)
      const task = await client.index(index.uid).resetTypoTolerance()
      await client.index(index.uid).waitForTask(task.taskUid)

      const response = await client.index(index.uid).getTypoTolerance()

      expect(response).toEqual(defaultTypoTolerance)
    })
  }
)

describe.each([{ permission: 'Public' }])(
  'Tests on typo tolerance',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get typo tolerance settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getTypoTolerance()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to update typo tolerance settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateTypoTolerance({})
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })

    test(`${permission} key: try to reset typo tolerance settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetTypoTolerance()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])(
  'Tests on typo tolerance',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })

    test(`${permission} key: try to get typo tolerance settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getTypoTolerance()
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to update typo tolerance settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateTypoTolerance({})
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: try to reset typo tolerance settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetTypoTolerance()
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
  test(`Test get typo tolerance route`, async () => {
    const route = `indexes/${index.uid}/settings/typo-tolerance`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).getTypoTolerance()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test update typo tolerance route`, async () => {
    const route = `indexes/${index.uid}/settings/typo-tolerance`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateTypoTolerance({})
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test reset typo tolerance route`, async () => {
    const route = `indexes/${index.uid}/settings/typo-tolerance`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetTypoTolerance()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
