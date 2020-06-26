import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  PUBLIC_KEY,
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
  acceptNewFields: true,
}

const defaultSettings = {
  rankingRules: defaultRankingRules,
  distinctAttribute: null,
  searchableAttributes: ['id', 'title', 'comment'],
  displayedAttributes: ['comment', 'title', 'id'],
  stopWords: [],
  synonyms: {},
  acceptNewFields: true,
}

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
])('Test on settings', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    await masterClient.createIndex(indexAndPK.uid, {
      primaryKey: indexAndPK.primaryKey,
    })
    const { updateId } = await masterClient
      .getIndex(index.uid)
      .addDocuments(dataset)
    await masterClient.getIndex(index.uid).waitForPendingUpdate(updateId)
  })
  test(`${permission} key: Get default settings of an index`, async () => {
    await client
      .getIndex(index.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty('searchableAttributes', [
          'id',
          'title',
          'comment',
        ])
        expect(response).toHaveProperty(
          'displayedAttributes',
          expect.any(Array)
        )
        const sortedAttributes = response.displayedAttributes
          ? response.displayedAttributes.sort()
          : undefined
        expect(sortedAttributes).toEqual(['id', 'title', 'comment'].sort())
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
        expect(response).toHaveProperty('acceptNewFields', true)
      })
  })

  test(`${permission} key: Get default settings of empty index with primary key`, async () => {
    await client
      .getIndex(indexAndPK.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty('searchableAttributes', ['id'])
        expect(response).toHaveProperty('displayedAttributes', ['id'])
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
        expect(response).toHaveProperty('acceptNewFields', true)
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
      .getIndex(index.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(index.uid)
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
        expect(response).toHaveProperty(
          'searchableAttributes',
          defaultSettings.searchableAttributes
        )
        expect(response).toHaveProperty(
          'displayedAttributes',
          expect.any(Array)
        )
        expect(response).toHaveProperty('stopWords', newSettings.stopWords)
        expect(response).toHaveProperty('synonyms', {})
        expect(response).toHaveProperty('acceptNewFields', true)
      })
  })

  test(`${permission} key: Update settings on empty index with primary key`, async () => {
    const newSettings = {
      distinctAttribute: 'title',
      rankingRules: ['asc(title)', 'typo'],
      stopWords: ['the'],
    }
    const { updateId } = await client
      .getIndex(indexAndPK.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(indexAndPK.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(indexAndPK.uid)
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
        expect(response).toHaveProperty('searchableAttributes', ['id'])
        expect(response).toHaveProperty(
          'displayedAttributes',
          expect.any(Array)
        )
        expect(response).toHaveProperty('stopWords', newSettings.stopWords)
        expect(response).toHaveProperty('synonyms', {})
        expect(response).toHaveProperty('acceptNewFields', true)
      })
  })

  test(`${permission} key: Reset settings`, async () => {
    const { updateId } = await client
      .getIndex(index.uid)
      .resetSettings()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(index.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty(
          'searchableAttributes',
          expect.any(Array)
        )
        const sortedSearchable = response.searchableAttributes
          ? response.searchableAttributes.sort()
          : undefined
        expect(sortedSearchable).toEqual(['id', 'title', 'comment'].sort())
        expect(response).toHaveProperty(
          'displayedAttributes',
          expect.any(Array)
        )
        const sortedDisplayed = response.displayedAttributes
          ? response.displayedAttributes.sort()
          : undefined
        expect(sortedDisplayed).toEqual(['id', 'title', 'comment'].sort())
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
        expect(response).toHaveProperty('acceptNewFields', true)
      })
  })

  test(`${permission} key: Reset settings of empty index`, async () => {
    const { updateId } = await client
      .getIndex(indexAndPK.uid)
      .resetSettings()
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(indexAndPK.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(indexAndPK.uid)
      .getSettings()
      .then((response: Types.Settings) => {
        expect(response).toHaveProperty('rankingRules', defaultRankingRules)
        expect(response).toHaveProperty('distinctAttribute', null)
        expect(response).toHaveProperty(
          'searchableAttributes',
          expect.any(Array)
        )
        const sortedSearchable = response.searchableAttributes
          ? response.searchableAttributes.sort()
          : undefined
        expect(sortedSearchable).toEqual(['id', 'title'].sort())
        expect(response).toHaveProperty(
          'displayedAttributes',
          expect.any(Array)
        )
        const sortedDisplayed = response.displayedAttributes
          ? response.displayedAttributes.sort()
          : undefined
        expect(sortedDisplayed).toEqual(['id', 'title'].sort())
        expect(response).toHaveProperty('stopWords', [])
        expect(response).toHaveProperty('synonyms', {})
        expect(response).toHaveProperty('acceptNewFields', true)
      })
  })

  test(`${permission} key: Update settings that verifies no overwrite in the settings`, async () => {
    const newSettings = {
      searchableAttributes: ['title'],
    }
    const { updateId } = await client
      .getIndex(index.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(index.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(index.uid)
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
        expect(response).toHaveProperty('acceptNewFields', true)
      })
  })

  test(`${permission} key: Update settings that verifies no overwrite in the settings on empty index with primary key`, async () => {
    const newSettings = {
      searchableAttributes: ['title'],
    }
    const { updateId } = await client
      .getIndex(indexAndPK.uid)
      .updateSettings(newSettings)
      .then((response: Types.EnqueuedUpdate) => {
        expect(response).toHaveProperty('updateId', expect.any(Number))
        return response
      })
    await client.getIndex(indexAndPK.uid).waitForPendingUpdate(updateId)
    await client
      .getIndex(indexAndPK.uid)
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
        expect(response).toHaveProperty('acceptNewFields', true)
      })
  })
})

describe.each([{ client: publicClient, permission: 'Public' }])(
  'Test on settings',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get settings and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getSettings()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to update settings and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateSettings({})
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
    test(`${permission} key: try to reset settings and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetSettings()
      ).rejects.toThrowError(`Invalid API key: ${PUBLIC_KEY}`)
    })
  }
)

describe.each([{ client: anonymousClient, permission: 'No' }])(
  'Test on settings',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })
    test(`${permission} key: try to get settings and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).getSettings()
      ).rejects.toThrowError(`You must have an authorization token`)
    })
    test(`${permission} key: try to update settings and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).updateSettings({})
      ).rejects.toThrowError(`You must have an authorization token`)
    })
    test(`${permission} key: try to reset settings and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).resetSettings()
      ).rejects.toThrowError(`You must have an authorization token`)
    })
  }
)
