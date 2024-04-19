import { ErrorStatusCode, Settings } from '../src/types'
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
const indexAndPK = {
  uid: 'movies_test_with_pk',
  primaryKey: 'id',
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([{ permission: 'Master' }, { permission: 'Admin' }])(
  'Test on settings',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('Master')
      const { taskUid: AddDocPkTask } = await client
        .index(indexAndPK.uid)
        .addDocuments(dataset, {
          primaryKey: indexAndPK.primaryKey,
        })
      await client.waitForTask(AddDocPkTask)

      const { taskUid: AddDocTask } = await client
        .index(index.uid)
        .addDocuments(dataset, {})
      await client.waitForTask(AddDocTask)
    })

    test(`${permission} key: Get default settings of an index`, async () => {
      const client = await getClient(permission)

      const response = await client.index(index.uid).getSettings()

      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Get default settings of empty index with primary key`, async () => {
      const client = await getClient(permission)

      const response = await client.index(indexAndPK.uid).getSettings()

      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Update settings`, async () => {
      const client = await getClient(permission)
      const newSettings: Settings = {
        filterableAttributes: ['title'],
        sortableAttributes: ['title'],
        distinctAttribute: 'title',
        proximityPrecision: 'byAttribute',
        searchableAttributes: ['title'],
        displayedAttributes: ['title'],
        rankingRules: ['id:asc', 'typo'],
        stopWords: ['the'],
        synonyms: { harry: ['potter'] },
        typoTolerance: {
          enabled: false,
          minWordSizeForTypos: {
            oneTypo: 1,
            twoTypos: 100,
          },
          disableOnWords: ['prince'],
          disableOnAttributes: ['comment'],
        },
        pagination: {
          maxTotalHits: 1000,
        },
        faceting: {
          maxValuesPerFacet: 50,
          sortFacetValuesBy: {
            '*': 'alpha',
          },
        },
        separatorTokens: ['&sep', '/', '|'],
        nonSeparatorTokens: ['&sep', '/', '|'],
        dictionary: ['J. K.', 'J. R. R.'],
        searchCutoffMs: 1000,
      }
      // Add the settings
      const task = await client.index(index.uid).updateSettings(newSettings)
      await client.index(index.uid).waitForTask(task.taskUid)

      // Fetch the settings
      const response = await client.index(index.uid).getSettings()

      // tests
      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Update settings with all null values`, async () => {
      const client = await getClient(permission)
      const newSettings: Settings = {
        filterableAttributes: null,
        sortableAttributes: null,
        distinctAttribute: null,
        searchableAttributes: null,
        displayedAttributes: null,
        rankingRules: null,
        stopWords: null,
        synonyms: null,
        typoTolerance: {
          enabled: null,
          minWordSizeForTypos: {
            oneTypo: null,
            twoTypos: null,
          },
          disableOnWords: null,
          disableOnAttributes: null,
        },
        faceting: {
          maxValuesPerFacet: null,
          sortFacetValuesBy: null,
        },
        pagination: {
          maxTotalHits: null,
        },
        separatorTokens: null,
        nonSeparatorTokens: null,
        dictionary: null,
        searchCutoffMs: null,
      }
      // Add the settings
      const task = await client.index(index.uid).updateSettings(newSettings)
      await client.index(index.uid).waitForTask(task.taskUid)

      // Fetch the settings
      const response = await client.index(index.uid).getSettings()

      // tests
      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Update settings on empty index with primary key`, async () => {
      const client = await getClient(permission)
      const newSettings = {
        distinctAttribute: 'title',
        rankingRules: ['title:asc', 'typo'],
        stopWords: ['the'],
      }
      const task = await client
        .index(indexAndPK.uid)
        .updateSettings(newSettings)
      await client.index(indexAndPK.uid).waitForTask(task.taskUid)

      const response = await client.index(indexAndPK.uid).getSettings()

      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Reset settings`, async () => {
      const client = await getClient(permission)
      const task = await client.index(index.uid).resetSettings()
      await client.index(index.uid).waitForTask(task.taskUid)

      const response = await client.index(index.uid).getSettings()

      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Reset settings of empty index`, async () => {
      const client = await getClient(permission)
      const task = await client.index(indexAndPK.uid).resetSettings()
      await client.index(index.uid).waitForTask(task.taskUid)

      const response = await client.index(indexAndPK.uid).getSettings()

      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Update searchableAttributes settings on empty index`, async () => {
      const client = await getClient(permission)
      const newSettings = {
        searchableAttributes: ['title'],
      }
      const task = await client.index(index.uid).updateSettings(newSettings)
      await client.index(index.uid).waitForTask(task.taskUid)

      const response = await client.index(index.uid).getSettings()

      expect(response).toMatchSnapshot()
    })

    test(`${permission} key: Update searchableAttributes settings on empty index with a primary key`, async () => {
      const client = await getClient(permission)
      const newSettings = {
        searchableAttributes: ['title'],
      }
      // Update settings
      const task = await client
        .index(indexAndPK.uid)
        .updateSettings(newSettings)
      // Wait for setting addition to be done
      await client.index(index.uid).waitForTask(task.taskUid)

      // Fetch settings
      const response = await client.index(indexAndPK.uid).getSettings()

      expect(response).toMatchSnapshot()
    })
  }
)

describe.each([{ permission: 'Search' }])(
  'Test on settings',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })
    test(`${permission} key: try to get settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).getSettings()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
    test(`${permission} key: try to update settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).updateSettings({})
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
    test(`${permission} key: try to reset settings and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).resetSettings()
      ).rejects.toHaveProperty('code', ErrorStatusCode.INVALID_API_KEY)
    })
  }
)

describe.each([{ permission: 'No' }])('Test on settings', ({ permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
  })
  test(`${permission} key: try to get settings and be denied`, async () => {
    const client = await getClient(permission)
    await expect(client.index(index.uid).getSettings()).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })
  test(`${permission} key: try to update settings and be denied`, async () => {
    const client = await getClient(permission)
    await expect(
      client.index(index.uid).updateSettings({})
    ).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })
  test(`${permission} key: try to reset settings and be denied`, async () => {
    const client = await getClient(permission)
    await expect(
      client.index(index.uid).resetSettings()
    ).rejects.toHaveProperty(
      'code',
      ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
    )
  })
})

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test getSettings route`, async () => {
    const route = `indexes/${index.uid}/settings`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).getSettings()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateSettings route`, async () => {
    const route = `indexes/${index.uid}/settings`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).updateSettings({})
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetSettings route`, async () => {
    const route = `indexes/${index.uid}/settings`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(
      client.index(index.uid).resetSettings()
    ).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
