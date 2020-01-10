import Meili from '../'
import dataset from '../../examples/small_movies.json'

const config = {
  host: 'http://127.0.0.1:7700',
}

const meili = new Meili(config)

const index = {
  name: 'Movies',
  uid: 'movies',
}

const randomDocument = '287947'
const offsetDocumentId = '157433'
const firstDocumentId = '299537'
const defaultNumberOfDocuments = 20


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
    .then((response: any) => {
      expect(response.name).toBe(index.name)
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})

test('get-index', async () => {
  await meili
    .Index(index.uid)
    .getIndex()
    .then((response: any) => {
      expect(response.name).toBe(index.name)
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })

  await expect(meili.listIndexes()).resolves.toHaveLength(1)
})

test('update-index', async () => {
  await meili
    .Index(index.uid)
    .updateIndex({ name: 'new name' })
    .then((response: any) => {
      expect(response.name).toBe('new name')
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
  await meili
    .Index(index.uid)
    .getIndex()
    .then((response: any) => {
      expect(response.name).toBe('new name')
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
  await meili
    .Index(index.uid)
    .updateIndex({ name: index.name })
    .then((response: any) => {
      expect(response.name).toBe(index.name)
      expect(response.uid).toBe(index.uid)
    })
    .catch((err) => {
      expect(err).toBe(null)
    })
})

///
/// SCHEMA
///
test('update-schema', async () => {
  try {
    await expect(
      meili.Index(index.uid).updateSchema({
        id: ['indexed', 'displayed', 'identifier'],
        title: ['displayed', 'indexed'],
        poster: ['displayed', 'indexed'],
        overview: ['indexed', 'displayed'],
        release_date: ['indexed', 'displayed'],
      })
    ).resolves.toHaveProperty('updateId')
  } catch (e) {
    console.log({ e })
  }
})

test('get-schema', async () => {
  await expect(meili.Index(index.uid).getSchema()).resolves.toBeDefined()
})

test('add-documents', async () => {
  await expect(
    meili.Index(index.uid).addDocuments(dataset)
  ).resolves.toHaveProperty('updateId')
})

jest.setTimeout(10 * 1000)
test('get-document', async () => {
  await sleep(5 * 1000)
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

test('delete-document', async () => {
  await expect(
    meili.Index(index.uid).deleteDocument(randomDocument)
  ).resolves.toHaveProperty('updateId')
  await expect(
    meili.Index(index.uid).getDocument(randomDocument)
  ).rejects.toThrow()
})

test('delete-documents', async () => {
  await expect(
    meili.Index(index.uid).deleteDocuments([firstDocumentId, offsetDocumentId])
  ).resolves.toHaveProperty('updateId')
  await expect(
    meili.Index(index.uid).getDocument(firstDocumentId)
  ).rejects.toThrow()
  await expect(
    meili.Index(index.uid).getDocument(offsetDocumentId)
  ).rejects.toThrow()
})

test('delete-all-documents', async () => {
  await expect(
    meili.Index(index.uid).deleteAllDocuments()
  ).resolves.toHaveProperty('updateId')
  await expect(meili.Index(index.uid).getDocuments()).resolves.toHaveLength(0)
})

test('delete-index', async () => {
  await expect(meili.Index(index.uid).deleteIndex()).resolves.toBeDefined()
  await expect(meili.listIndexes()).resolves.toHaveLength(0)
})

test('reset-stop', async () => {
  await clearAllIndexes()
})
