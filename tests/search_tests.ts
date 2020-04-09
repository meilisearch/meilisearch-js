import * as Types from '../src/types'
import {
  clearAllIndexes,
  sleep,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}
const emptyIndex = {
  uid: 'empty_test',
}

const dataset = [
  { id: 123, title: 'Pride and Prejudice', comment: 'A great book' },
  {
    id: 456,
    title: 'Le Petit Prince',
    comment: 'A french book about a prince that walks on little cute planets',
  },
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

beforeAll(async () => {
  await clearAllIndexes(config)
  await masterClient.createIndex(index)
  await masterClient.getIndex(index.uid).addDocuments(dataset)
  await sleep(500)
})

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
  { client: publicClient, permission: 'Public' },
])('Test on search', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index)
    await masterClient.createIndex(emptyIndex)
    await masterClient.getIndex(index.uid).addDocuments(dataset)
    await sleep(500)
  })
  test(`${permission} key: Basic search`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince')
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: Search with options`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', { limit: 1 })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: Search with options`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', { limit: 1 })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })
  test(`${permission} key: Search with limit and offset`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        limit: 1,
        offset: 1,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', [
          {
            id: 4,
            title: 'Harry Potter and the Half-Blood Prince',
            comment: 'The best book',
          },
        ])
        expect(response).toHaveProperty('offset', 1)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: Search with matches parameter and small croplength`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        filters: 'title:Le Petit Prince',
        attributesToCrop: '*',
        cropLength: 5,
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
        expect(response.hits[0]).toHaveProperty('_matchesInfo', {})
      })
  })

  test(`${permission} key: Search with all options and all fields`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: '*',
        cropLength: 6,
        attributesToHighlight: '*',
        filters: 'title:Le Petit Prince',
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 5)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
        expect(response.hits[0]).toHaveProperty(
          '_formatted',
          expect.any(Object)
        )
        expect(response.hits[0]._formatted).toHaveProperty(
          'title',
          'Petit <em>Prince</em>'
        )
        expect(response.hits[0]).toHaveProperty(
          '_matchesInfo',
          expect.any(Object)
        )
      })
  })

  test(`${permission} key: Search with all options but specific fields`, async () => {
    await client
      .getIndex(index.uid)
      .search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['id', 'title'],
        cropLength: 6,
        attributesToHighlight: ['id', 'title'],
        filters: 'title:Le Petit Prince',
        matches: true,
      })
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 5)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
        expect(response.hits[0]).toHaveProperty(
          '_formatted',
          expect.any(Object)
        )
        expect(response.hits[0]).not.toHaveProperty(
          'description',
          expect.any(Object)
        )
        expect(response.hits[0]._formatted).toHaveProperty(
          'title',
          'Petit <em>Prince</em>'
        )
        expect(response.hits[0]._formatted).not.toHaveProperty('description')
        expect(response.hits[0]).toHaveProperty(
          '_matchesInfo',
          expect.any(Object)
        )
      })
  })

  test(`${permission} key: Search on index with no documents and no primary key`, async () => {
    await client
      .getIndex(emptyIndex.uid)
      .search('prince')
      .then((response: Types.SearchResponse) => {
        expect(response).toHaveProperty('hits', [])
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(0)
      })
  })
  test(`${permission} key: Try to Search on deleted index and fail`, async () => {
    await masterClient.getIndex(index.uid).deleteIndex()
    sleep(500)
    await expect(
      client.getIndex(index.uid).search('prince')
    ).rejects.toThrowError(`Index movies_test not found`)
  })
  test(`${permission} key: Try to use asterix in attributes to retrieve and fail`, async () => {
    await expect(
      client.getIndex(index.uid).search('prince', {
        attributesToRetrieve: '*',
      })
    ).rejects.toThrowError(/not found/)
  })
})

describe.each([{ client: anonymousClient, permission: 'Client' }])(
  'Test failing test on search',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index)
    })
    test(`${permission} key: Try Basic search and be denied`, async () => {
      await expect(
        client.getIndex(index.uid).search('prince')
      ).rejects.toThrowError(`Invalid API key: Need a token`)
    })
  }
)
