import Meili from '../src'
import * as Types from '../src/types'

// TODO: Find a solution to make it work with import
const dataset = require('../examples/small_movies.json')
const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: '123',
}

const meili = new Meili(config)

const index = {
  uid: 'movies_test',
}
const indexAndIndentifier = {
  uid: 'movies_test2',
  primaryKey: 'id',
}

const randomDocument = '287947'
const offsetDocumentId = '157433'
const firstDocumentId = '299537'
const defaultNumberOfDocuments = 20
jest.setTimeout(100 * 1000)

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const clearAllIndexes = async () => {
  const indexes = await meili
    .listIndexes()
    .then((response: any) => {
      return response.map((elem: any) => elem.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  for (const indexUid of indexes) {
    await meili
      .getIndex(indexUid)
      .deleteIndex()
      .catch((err) => {
        expect(err).toBe(null)
      })
  }
  await expect(meili.listIndexes()).resolves.toHaveLength(0)
}

test('reset-start', async () => {
  await clearAllIndexes()
})

///
/// INDEXES
///

test('create-index', async () => {
  await meili
    .createIndex(index)
    .then((response: Types.CreateIndexResponse) => {
      expect(response.uid).toBe(index.uid)
      expect(response.primaryKey).toBe(null)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .createIndex(indexAndIndentifier)
    .then((response: Types.CreateIndexResponse) => {
      expect(response.uid).toBe(indexAndIndentifier.uid)
      expect(response.primaryKey).toBe(indexAndIndentifier.primaryKey)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})

test('get-index', async () => {
  await meili
    .getIndex(index.uid)
    .show()
    .then((response: Types.CreateIndexResponse) => {
      expect(response.uid).toBe(index.uid)
      expect(response.primaryKey).toBe(null)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
  await expect(meili.listIndexes()).resolves.toHaveLength(2)
})

test('get-stats', async () => {
  await meili
    .getIndex(index.uid)
    .getStats()
    .then((response: any) => {
      expect(response.numberOfDocuments).toBe(0)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await expect(meili.listIndexes()).resolves.toHaveLength(2)
})

test('update-index', async () => {
  await meili
    .getIndex(index.uid)
    .updateIndex({ primaryKey: 'id' })
    .then((response: any) => {
      expect(response.uid).toBe(index.uid)
      expect(response.primaryKey).toBe('id')
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})

///
/// DOCUMENTS
///

test('add-documents', async () => {
  await expect(
    meili.getIndex(index.uid).addDocuments(dataset, {
      primaryKey: 'id',
    })
  ).resolves.toHaveProperty('updateId')
  await expect(
    meili.getIndex(indexAndIndentifier.uid).addDocuments(dataset)
  ).resolves.toHaveProperty('updateId')
})
test('update-documents', async () => {
  await expect(
    meili.getIndex(index.uid).updateDocuments(dataset, {
      primaryKey: 'id',
    })
  ).resolves.toHaveProperty('updateId')
  await expect(
    meili.getIndex(indexAndIndentifier.uid).addDocuments(dataset)
  ).resolves.toHaveProperty('updateId')
})

test('get-index-primary-key', async () => {
  await sleep(3 * 1000)
  await meili
    .getIndex(index.uid)
    .show()
    .then((response: Types.CreateIndexResponse) => {
      expect(response.uid).toBe(index.uid)
      expect(response.primaryKey).toBe('id')
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
  await expect(meili.listIndexes()).resolves.toHaveLength(2)
})

test('updates', async () => {
  await expect(
    meili.getIndex(index.uid).getUpdateStatus(0)
  ).resolves.toHaveProperty('status')
  await expect(
    meili.getIndex(index.uid).getAllUpdateStatus()
  ).resolves.toHaveLength(2)
})

test('get-document', async () => {
  await sleep(3 * 1000)
  await expect(
    meili.getIndex(index.uid).getDocument(randomDocument)
  ).resolves.toEqual(dataset[0])
})

test('get-documents', async () => {
  await meili
    .getIndex(index.uid)
    .getDocuments()
    .then((response: any) => {
      expect(response.length).toBe(defaultNumberOfDocuments)
      expect(response[0].id).toEqual(firstDocumentId)
    })

  await meili
    .getIndex(index.uid)
    .getDocuments({
      offset: 1,
    })
    .then((response: any) => {
      expect(response.length).toBe(defaultNumberOfDocuments)
      expect(response[0].id).toEqual(offsetDocumentId)
    })

  await meili
    .getIndex(index.uid)
    .getDocuments({
      offset: 1,
      limit: 1,
    })
    .then((response: any) => {
      expect(response.length).toBe(1)
      expect(response[0].id).toEqual(offsetDocumentId)
    })

  await meili
    .getIndex(index.uid)
    .getDocuments({
      offset: 1,
      attributesToRetrieve: ['id', 'title'],
    })
    .then((response: any) => {
      expect(response.length).toBe(20)
      expect(response[0].id).toEqual('157433')
      expect(response[0]).not.toHaveProperty('poster')
    })

  await meili
    .getIndex(index.uid)
    .getDocuments({
      offset: 1,
      limit: 2,
      attributesToRetrieve: ['id', 'title'],
    })
    .then((response: any) => {
      expect(response.length).toBe(2)
      expect(response[0].id).toEqual('157433')
      expect(response[0]).not.toHaveProperty('poster')
    })
})

test('search', async () => {
  try {
    await meili
      .getIndex(index.uid)
      .search('Escape')
      .then((response: any) => {
        expect(response.hits).toHaveLength(2)
        expect(response.hits[0]).toHaveProperty('id', '522681')
      })
    await meili
      .getIndex(index.uid)
      .search('Escape', {
        offset: 1,
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '338952')
      })
    await meili
      .getIndex(index.uid)
      .search('The', {
        offset: 1,
        limit: 5,
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(5)
        expect(response.hits[0]).toHaveProperty('id', '504172')
      })
    await meili
      .getIndex(index.uid)
      .search('The', {
        offset: 1,
        limit: 5,
        attributesToRetrieve: ['title', 'id'],
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(5)
        expect(response.hits[0]).toHaveProperty('id', '504172')
        expect(response.hits[0]).not.toHaveProperty('poster')
      })
    await meili
      .getIndex(index.uid)
      .search('scientist', {
        offset: 0,
        limit: 5,
        attributesToRetrieve: ['overview', 'id'],
        attributesToCrop: ['overview'],
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '485811')
        expect(response.hits[0]['overview']).not.toEqual(
          response.hits[0]['_formatted']['overview']
        )
      })
    await meili
      .getIndex(index.uid)
      .search('scientist', {
        offset: 0,
        limit: 5,
        attributesToRetrieve: ['overview', 'id'],
        attributesToCrop: ['overview'],
        cropLength: 1,
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '485811')
        expect(response.hits[0]._formatted.overview).toEqual(' s')
      })

    await meili
      .getIndex(index.uid)
      .search('scientist', {
        offset: 0,
        limit: 5,
        attributesToRetrieve: ['overview', 'id'],
        attributesToCrop: ['overview'],
        attributesToHighlight: ['overview'],
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '485811')
        expect(response.hits[0]._formatted.overview).toMatch(
          /\<em\>scientist\<\/em\>/
        )
      })
    await meili
      .getIndex(index.uid)
      .search('The', {
        offset: 0,
        limit: 5,
        filters: 'title:The Mule',
        attributesToHighlight: ['overview'],
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '504172')
        expect(response.hits[0]._formatted.overview).toMatch(
          /\<em\>the\<\/em\>/
        )
      })
    await meili
      .getIndex(index.uid)
      .search('woman', {
        filters: 'title:After',
        matches: true,
      })
      .then((response: any) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '537915')
        expect(response.hits[0]._matchesInfo.overview).toEqual([
          { start: 8, length: 5 },
        ])
      })
  } catch (e) {
    throw e
  }
})

/*
 * SETTINGS
 */
test('add-settings', async () => {
  await expect(
    meili.getIndex(index.uid).updateSettings({
      synonyms: {
        wolverine: ['xmen', 'logan'],
        logan: ['wolverine', 'xmen'],
      },
    })
  ).resolves.toHaveProperty('updateId')
})
test('get-settings', async () => {
  await expect(meili.getIndex(index.uid).getSettings()).resolves.toBeDefined()
})
test('reset-settings', async () => {
  await expect(
    meili.getIndex(index.uid).resetSettings()
  ).resolves.toHaveProperty('updateId')
})

/*
 * SETTINGS SYNONYMS
 */

test('add-synonyms', async () => {
  await expect(
    meili.getIndex(index.uid).updateSynonyms({
      wolverine: ['xmen', 'logan'],
      logan: ['wolverine', 'xmen'],
    })
  ).resolves.toHaveProperty('updateId')
})
test('get-synonyms', async () => {
  await expect(meili.getIndex(index.uid).getSynonyms()).resolves.toBeDefined()
})
test('reset-synonyms', async () => {
  await sleep(1000)
  await expect(
    meili.getIndex(index.uid).resetSynonyms()
  ).resolves.toHaveProperty('updateId')
})

/*
 * SETTINGS STOPWORDS
 */

test('add-stop-words', async () => {
  await expect(
    meili.getIndex(index.uid).updateStopWords(['the', 'of'])
  ).resolves.toHaveProperty('updateId')
})
test('get-stop-words', async () => {
  await expect(meili.getIndex(index.uid).getStopWords()).resolves.toBeDefined()
})
test('reset-stop-words', async () => {
  await expect(
    meili.getIndex(index.uid).resetStopWords()
  ).resolves.toHaveProperty('updateId')
})

/*
 * SETTINGS RANKING-RULES
 */

test('add-ranking-rules', async () => {
  await expect(
    meili.getIndex(index.uid).updateRankingRules(['typo', 'asc(release_date)'])
  ).resolves.toHaveProperty('updateId')
})
test('get-ranking-rules', async () => {
  await expect(
    meili.getIndex(index.uid).getRankingRules()
  ).resolves.toBeDefined()
})
test('reset-ranking-rules', async () => {
  await expect(
    meili.getIndex(index.uid).resetRankingRules()
  ).resolves.toHaveProperty('updateId')
})

/*
 * SETTINGS DISTINCT ATTRIBUTE
 */

test('add-distinct-attribute', async () => {
  await expect(
    meili.getIndex(index.uid).updateDistinctAttribute('id')
  ).resolves.toHaveProperty('updateId')
})
test('get-distinct-attribute', async () => {
  await expect(
    meili.getIndex(index.uid).getDistinctAttribute()
  ).resolves.toBeDefined()
})
test('reset-distinct-attribute', async () => {
  await expect(
    meili.getIndex(index.uid).resetDistinctAttribute()
  ).resolves.toHaveProperty('updateId')
})

/*
 * SETTINGS SEARCHABLE ATTRIBUTES
 */

test('add-searchable-attributes', async () => {
  await expect(
    meili.getIndex(index.uid).updateSearchableAttributes(['title', 'overview'])
  ).resolves.toHaveProperty('updateId')
})
test('get-searchable-attributes', async () => {
  await expect(
    meili.getIndex(index.uid).getSearchableAttributes()
  ).resolves.toBeDefined()
})
test('reset-searchable-attributes', async () => {
  await expect(
    meili.getIndex(index.uid).resetSearchableAttributes()
  ).resolves.toHaveProperty('updateId')
})

/*
 * SETTINGS DISPLAYED ATTRIBUTES
 */

test('add-displayed-attributes', async () => {
  await expect(
    meili.getIndex(index.uid).updateDisplayedAttributes(['title', 'overview'])
  ).resolves.toHaveProperty('updateId')
})
test('get-displayed-attributes', async () => {
  await expect(
    meili.getIndex(index.uid).getDisplayedAttributes()
  ).resolves.toBeDefined()
})
test('reset-displayed-attributes', async () => {
  await expect(
    meili.getIndex(index.uid).resetDisplayedAttributes()
  ).resolves.toHaveProperty('updateId')
})

/*
 * SETTINGS ACCEPT NEW FIELDS
 */

test('update-accept-new-fields', async () => {
  await expect(
    meili.getIndex(index.uid).updateAcceptNewFields(false)
  ).resolves.toHaveProperty('updateId')
})
test('get-accept-new-fields', async () => {
  await expect(
    meili.getIndex(index.uid).getAcceptNewFields()
  ).resolves.toBeDefined()
})

test('delete-document', async () => {
  await sleep(1000)
  await expect(
    meili.getIndex(index.uid).deleteDocument(randomDocument)
  ).resolves.toHaveProperty('updateId')
  await sleep(1000)
  await expect(
    meili.getIndex(index.uid).getDocument(randomDocument)
  ).rejects.toThrow()
})

test('delete-documents', async () => {
  await expect(
    meili
      .getIndex(index.uid)
      .deleteDocuments([firstDocumentId, offsetDocumentId])
  ).resolves.toHaveProperty('updateId')
  await sleep(2000)
  await expect(
    meili.getIndex(index.uid).getDocument(firstDocumentId)
  ).rejects.toThrow()
  await sleep(1000)
  await expect(
    meili.getIndex(index.uid).getDocument(offsetDocumentId)
  ).rejects.toThrow()
})

test('delete-all-documents', async () => {
  await sleep(1000)
  await expect(
    meili.getIndex(index.uid).deleteAllDocuments()
  ).resolves.toHaveProperty('updateId')
  await sleep(1000)
  await expect(meili.getIndex(index.uid).getDocuments()).resolves.toHaveLength(
    0
  )
})

test('delete-index', async () => {
  await sleep(2000)
  await expect(meili.getIndex(index.uid).deleteIndex()).resolves.toBeDefined()
})

test('reset-stop', async () => {
  await clearAllIndexes()
})
