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
const indexAndPK = {
  uid: 'movies_test_with_pk',
  primaryKey: 'id',
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

const defaultRankingRules = [
  'typo',
  'words',
  'proximity',
  'attribute',
  'wordsPosition',
  'exactness',
]

const defaultSettingsEmpty = {
  rankingRules: defaultRankingRules,
  distinctAttribute: null,
  searchableAttributes: [],
  displayedAttributes: [],
  stopWords: [],
  synonyms: {},
}

const defaultSettings = {
  rankingRules: defaultRankingRules,
  distinctAttribute: null,
  searchableAttributes: ['id', 'title', 'comment'],
  displayedAttributes: ['comment', 'title', 'id'],
  stopWords: [],
  synonyms: {},
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on settings', ({ client, permission }) => {
  beforeEach(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    await masterClient.createIndex(indexAndPK.uid, {
      primaryKey: indexAndPK.primaryKey,
    })
    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Get default settings of an index`, async () => {
    await client
      .index(index.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty('searchableAttributes', ['*'])
        expect(response).toHaveProperty('displayedAttributes', ['*'])
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
      })
  })

  test(`${permission} key: Get default settings of empty index with primary key`, async () => {
    await client
      .index(indexAndPK.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty('searchableAttributes', ['*'])
        expect(response).toHaveProperty('displayedAttributes', ['*'])
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
      })
  })

  test(`${permission} key: Update settings`, async () => {
    const newSettings = {
      distinctAttribute: 'title',
      rankingRules: ['asc(title)', 'typo'],
      stopWords: ['the'],
      attributesForFaceting: [],
    }
    const { updateId } = await client
      .index(index.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty(
          'rankingRules',
          newSettings.rankingRules
        )
        expect(response).toHaveProperty(
          'distinctAttribute',
          newSettings.distinctAttribute
        )
        expect(response).toHaveProperty('searchableAttributes', ['*'])
        expect(response).toHaveProperty('displayedAttributes', ['*'])
        expect(response).toHaveProperty('stopWords', newSettings.stopWords)
        expect(response).toHaveProperty('synonyms', {})
      })
  })

  test(`${permission} key: Update settings on empty index with primary key`, async () => {
    const newSettings = {
      distinctAttribute: 'title',
      rankingRules: ['asc(title)', 'typo'],
      stopWords: ['the'],
    }
    const { updateId } = await client
      .index(indexAndPK.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexAndPK.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexAndPK.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty(
          'rankingRules',
          newSettings.rankingRules
        )
        expect(response).toHaveProperty(
          'distinctAttribute',
          newSettings.distinctAttribute
        )
        expect(response).toHaveProperty('searchableAttributes', ['*'])
        expect(response).toHaveProperty('displayedAttributes', ['*'])
        expect(response).toHaveProperty('stopWords', newSettings.stopWords)
        expect(response).toHaveProperty('synonyms', {})
      })
  })

  test(`${permission} key: Reset settings`, async () => {
    const { updateId } = await client
      .index(index.uid)
      .resetSettings()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty('searchableAttributes', ['*'])
        expect(response).toHaveProperty('displayedAttributes', ['*'])
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
      })
  })

  test(`${permission} key: Reset settings of empty index`, async () => {
    const { updateId } = await client
      .index(indexAndPK.uid)
      .resetSettings()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexAndPK.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexAndPK.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty('searchableAttributes', ['*'])
        expect(response).toHaveProperty('displayedAttributes', ['*'])
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
      })
  })

  test(`${permission} key: Update settings that verifies no overwrite in the settings`, async () => {
    const newSettings = {
      searchableAttributes: ['title'],
    }
    const { updateId } = await client
      .index(index.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(index.uid).waitForPendingUpdate(updateId)
    await client
      .index(index.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty(
          'distinctAttribute',
          defaultSettings.distinctAttribute
        )
        expect(response).toHaveProperty(
          'searchableAttributes',
          newSettings.searchableAttributes
        )
        expect(response).toHaveProperty(
          'displayedAttributes',
          expect.any(Array)
        )
        expect(response).toHaveProperty('stopWords', defaultSettings.stopWords)
        expect(response).toHaveProperty('synonyms', {})
      })
  })

  test(`${permission} key: Update settings that verifies no overwrite in the settings on empty index with primary key`, async () => {
    const newSettings = {
      searchableAttributes: ['title'],
    }
    const { updateId } = await client
      .index(indexAndPK.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.index(indexAndPK.uid).waitForPendingUpdate(updateId)
    await client
      .index(indexAndPK.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty(
          'distinctAttribute',
          defaultSettingsEmpty.distinctAttribute
        )
        expect(response).toHaveProperty(
          'searchableAttributes',
          newSettings.searchableAttributes
        )
        expect(response).toHaveProperty(
          'displayedAttributes',
          expect.any(Array)
        )
        expect(response).toHaveProperty('stopWords', defaultSettings.stopWords)
        expect(response).toHaveProperty('synonyms', {})
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on settings',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })
    test(`${permission} key: try to get settings and be denied`, async () => {
      await expect(
        client.index(index.uid).getSettings()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to update settings and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSettings({})
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
    test(`${permission} key: try to reset settings and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSettings()
      ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INVALID_TOKEN)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on settings',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
    })
    test(`${permission} key: try to get settings and be denied`, async () => {
      await expect(
        client.index(index.uid).getSettings()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to update settings and be denied`, async () => {
      await expect(
        client.index(index.uid).updateSettings({})
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
    test(`${permission} key: try to reset settings and be denied`, async () => {
      await expect(
        client.index(index.uid).resetSettings()
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe('Tests on url construction', () => {
  test(`Test getSettings route`, async () => {
    const route = `indexes/${index.uid}/settings`
    await expect(
      badHostClient.index(index.uid).getSettings()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test updateSettings route`, async () => {
    const route = `indexes/${index.uid}/settings`
    await expect(
      badHostClient.index(index.uid).updateSettings({})
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test resetSettings route`, async () => {
    const route = `indexes/${index.uid}/settings`
    await expect(
      badHostClient.index(index.uid).resetSettings()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
