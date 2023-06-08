import {
  clearAllIndexes,
  config,
  getClient,
} from './utils/meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}

const dataset = [
  {
    id: 123,
    title: 'Pride and Prejudice',
    genres: ['romance', 'action'],
  },
  {
    id: 456,
    title: 'Le Petit Prince',
    genres: ['adventure', 'comedy'],
  },
  {
    id: 2,
    title: 'Le Rouge et le Noir',
    genres: 'romance',
  },
  {
    id: 1,
    title: 'Alice In Wonderland',
    genres: ['adventure'],
  },
]

describe.each([
  { permission: 'Master' },
  { permission: 'Admin' },
  { permission: 'Search' },
])('Test on POST search', ({ permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    const client = await getClient('Master')
    const newFilterableAttributes = ['genres', 'title']
    await client.createIndex(index.uid)
    await client.index(index.uid).updateSettings({
      filterableAttributes: newFilterableAttributes,
    })
    const { taskUid } = await client.index(index.uid).addDocuments(dataset)
    await client.waitForTask(taskUid)
  })

  test(`${permission} key: basic facet value search`, async () => {
    const client = await getClient(permission)

    const params = {
      facetQuery: 'a',
      facetName: 'genres',
    }
    const response = await client.index(index.uid).searchForFacetValues(params)

    expect(response.facetHits.length).toEqual(2)
    expect(response.facetQuery).toEqual('a')
  })

  test(`${permission} key: facet value search with no facet query`, async () => {
    const client = await getClient(permission)

    const params = {
      facetName: 'genres',
    }
    const response = await client.index(index.uid).searchForFacetValues(params)

    expect(response.facetHits.length).toEqual(4)
    expect(response.facetQuery).toEqual(null)
  })

  test(`${permission} key: facet value search with filter`, async () => {
    const client = await getClient(permission)

    const params = {
      facetName: 'genres',
      facetQuery: 'a',
      filter: ['genres = action'],
    }

    const response = await client.index(index.uid).searchForFacetValues(params)

    expect(response.facetHits.length).toEqual(1)
  })

  test(`${permission} key: facet value search with search query`, async () => {
    const client = await getClient(permission)

    const params = {
      facetName: 'genres',
      facetQuery: 'a',
      q: 'Alice',
    }
    const response = await client.index(index.uid).searchForFacetValues(params)

    expect(response.facetHits.length).toEqual(1)
  })
})

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})
