import Meili from '..'
import * as Types from '../types'
import dataset from '../../examples/small_movies.json'

const config = {
  host: 'http://127.0.0.1:7700',
}

const meili = new Meili(config)

const index = {
  uid: 'movies',
}
const indexAndIndentifier = {
  uid: 'movies2',
  identifier: 'id',
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
      .Index(indexUid)
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
      expect(response.identifier).toBe(null)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await meili
    .createIndex(indexAndIndentifier)
    .then((response: Types.CreateIndexResponse) => {
      expect(response.uid).toBe(indexAndIndentifier.uid)
      expect(response.identifier).toBe(indexAndIndentifier.identifier)
    })
    .catch((err) => {
      console.log({ msg: err.response.data.message })
      expect(err).toBe(null)
    })
})

test('get-index', async () => {
  await meili
    .Index(index.uid)
    .getIndex()
    .then((response: Types.CreateIndexResponse) => {
      expect(response.uid).toBe(index.uid)
      expect(response.identifier).toBe(null)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
  await expect(meili.listIndexes()).resolves.toHaveLength(2)
})

// test('get-stats', async () => {
//   await meili
//     .Index(index.uid)
//     .getStats()
//     .then((response: any) => {
//       expect(response.numberOfDocuments).toBe(0)
//     })
//     .catch((err) => {
//       expect(err).toBe(null)
//     })

//   await expect(meili.listIndexes()).resolves.toHaveLength(1)
// })

test('update-index', async () => {
  await meili
    .Index(index.uid)
    .updateIndex({ identifier: 'id' })
    .then((response: any) => {
      expect(response.uid).toBe(index.uid)
      expect(response.identifier).toBe('id')
    })
    .catch((err) => {
      // console.log({ ...err.response })
      expect(err).toBe(null)
    })
})

///
/// DOCUMENTS
///

test('add-documents', async () => {
  await expect(
    meili.Index(index.uid).addDocuments(dataset, {
      identifier: 'id',
    })
  ).resolves.toHaveProperty('updateId')
  await expect(
    meili.Index(indexAndIndentifier.uid).addDocuments(dataset)
  ).resolves.toHaveProperty('updateId')
})

test('get-index-identifier', async () => {
  await sleep(3 * 1000)
  await meili
    .Index(index.uid)
    .getIndex()
    .then((response: Types.CreateIndexResponse) => {
      expect(response.uid).toBe(index.uid)
      expect(response.identifier).toBe('id')
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
  await expect(meili.listIndexes()).resolves.toHaveLength(2)
})

test('updates', async () => {
  await expect(meili.Index(index.uid).getUpdate(0)).resolves.toHaveProperty(
    'status'
  )
  await expect(meili.Index(index.uid).getUpdates()).resolves.toHaveLength(1)
})

test('get-document', async () => {
  await sleep(3 * 1000)
  await expect(
    meili.Index(index.uid).getDocument(randomDocument)
  ).resolves.toEqual(dataset[0])
})

test('get-documents', async () => {
  await meili
    .Index(index.uid)
    .getDocuments()
    .then((response: any) => {
      expect(response.length).toBe(defaultNumberOfDocuments)
      expect(response[0].id).toEqual(firstDocumentId)
    })

  await meili
    .Index(index.uid)
    .getDocuments({
      offset: 1,
    })
    .then((response: any) => {
      expect(response.length).toBe(defaultNumberOfDocuments)
      expect(response[0].id).toEqual(offsetDocumentId)
    })

  await meili
    .Index(index.uid)
    .getDocuments({
      offset: 1,
      limit: 1,
    })
    .then((response: any) => {
      expect(response.length).toBe(1)
      expect(response[0].id).toEqual(offsetDocumentId)
    })
  // TODO: wait for fix
  await meili
    .Index(index.uid)
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
    .Index(index.uid)
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
      .Index(index.uid)
      .search('Escape')
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(2)
        expect(response.hits[0]).toHaveProperty('id', '522681')
      })
    await meili
      .Index(index.uid)
      .search('Escape', {
        offset: 1,
      })
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '338952')
      })
    await meili
      .Index(index.uid)
      .search('The', {
        offset: 1,
        limit: 5,
      })
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(5)
        expect(response.hits[0]).toHaveProperty('id', '504172')
      })
    await meili
      .Index(index.uid)
      .search('The', {
        offset: 1,
        limit: 5,
        attributesToRetrieve: ['title', 'id'],
      })
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(5)
        expect(response.hits[0]).toHaveProperty('id', '504172')
        expect(response.hits[0]).not.toHaveProperty('poster')
      })
    await meili
      .Index(index.uid)
      .search('scientist', {
        offset: 0,
        limit: 5,
        attributesToRetrieve: ['overview', 'id'],
        attributesToCrop: ['overview'],
      })
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '485811')
        expect(response.hits[0].overview).not.toEqual(
          response.hits[0]._formatted.overview
        )
      })
    await meili
      .Index(index.uid)
      .search('scientist', {
        offset: 0,
        limit: 5,
        attributesToRetrieve: ['overview', 'id'],
        attributesToCrop: ['overview'],
        cropLength: 1,
      })
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '485811')
        expect(response.hits[0]._formatted.overview).toEqual(' s')
      })

    await meili
      .Index(index.uid)
      .search('scientist', {
        offset: 0,
        limit: 5,
        attributesToRetrieve: ['overview', 'id'],
        attributesToCrop: ['overview'],
        attributesToHighlight: ['overview'],
      })
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '485811')
        expect(response.hits[0]._formatted.overview).toMatch(
          /\<em\>scientist\<\/em\>/
        )
      })
    await meili
      .Index(index.uid)
      .search('The', {
        offset: 0,
        limit: 5,
        filters: 'title:The Mule',
        attributesToHighlight: ['overview'],
      })
      .then((response: Types.SearchResponse) => {
        expect(response.hits).toHaveLength(1)
        expect(response.hits[0]).toHaveProperty('id', '504172')
        expect(response.hits[0]._formatted.overview).toMatch(
          /\<em\>the\<\/em\>/
        )
      })
    await meili
      .Index(index.uid)
      .search('woman', {
        filters: 'title:After',
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
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

// test('delete-document', async () => {
//   await sleep(1000)
//   await expect(
//     meili.Index(index.uid).deleteDocument(randomDocument)
//   ).resolves.toHaveProperty('updateId')
//   await sleep(1000)
//   await expect(
//     meili.Index(index.uid).getDocument(randomDocument)
//   ).rejects.toThrow()
// })

// test('delete-documents', async () => {
//   await expect(
//     meili.Index(index.uid).deleteDocuments([firstDocumentId, offsetDocumentId])
//   ).resolves.toHaveProperty('updateId')
//   await sleep(1000)
//   await expect(
//     meili.Index(index.uid).getDocument(firstDocumentId)
//   ).rejects.toThrow()
//   await sleep(1000)
//   await expect(
//     meili.Index(index.uid).getDocument(offsetDocumentId)
//   ).rejects.toThrow()
// })

// test('delete-all-documents', async () => {
//   await sleep(1000)
//   await expect(
//     meili.Index(index.uid).deleteAllDocuments()
//   ).resolves.toHaveProperty('updateId')
//   await sleep(1000)
//   await expect(meili.Index(index.uid).getDocuments()).resolves.toHaveLength(0)
// })

// test('delete-index', async () => {
//   await sleep(2000)
//   await expect(meili.Index(index.uid).deleteIndex()).resolves.toBeDefined()
//   await expect(meili.listIndexes()).resolves.toHaveLength(0)
// })

test('reset-stop', async () => {
  // await clearAllIndexes()
})
