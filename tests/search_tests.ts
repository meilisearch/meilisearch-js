import AbortController from 'abort-controller'
import { ErrorStatusCode, EnqueuedUpdate } from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
  anonymousClient,
  BAD_HOST,
  MeiliSearch,
} from './meilisearch-test-utils'

const index = {
  uid: 'movies_test',
}
const emptyIndex = {
  uid: 'empty_test',
}

const dataset = [
  {
    id: 123,
    title: 'Pride and Prejudice',
    comment: 'A great book',
    genre: 'romance',
  },
  {
    id: 456,
    title: 'Le Petit Prince',
    comment: 'A french book about a prince that walks on little cute planets',
    genre: 'adventure',
  },
  {
    id: 2,
    title: 'Le Rouge et le Noir',
    comment: 'Another french book',
    genre: 'romance',
  },
  {
    id: 1,
    title: 'Alice In Wonderland',
    comment: 'A weird book',
    genre: 'adventure',
  },
  {
    id: 1344,
    title: 'The Hobbit',
    comment: 'An awesome book',
    genre: 'sci fi',
  },
  {
    id: 4,
    title: 'Harry Potter and the Half-Blood Prince',
    comment: 'The best book',
    genre: 'fantasy',
  },
  { id: 42, title: "The Hitchhiker's Guide to the Galaxy", genre: 'fantasy' },
]

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
  { client: publicClient, permission: 'Public' },
])('Test on POST search', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    await masterClient.createIndex(emptyIndex.uid)

    const newFilterableAttributes = ['genre', 'title', 'id']
    try {
      const response: EnqueuedUpdate = await masterClient
        .index(index.uid)
        .updateSettings({
          filterableAttributes: newFilterableAttributes,
          sortableAttributes: ['id'],
        })
      expect(response).toHaveProperty('updateId', expect.any(Number))
      await masterClient
        .index(index.uid)
        .waitForPendingUpdate(response.updateId)
    } catch (error) {
      throw new Error(error)
    }

    const { updateId } = await masterClient
      .index(index.uid)
      .addDocuments(dataset)
    await masterClient.index(index.uid).waitForPendingUpdate(updateId)
  })

  test(`${permission} key: Basic search`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {})
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 20)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Basic phrase search`, async () => {
    try {
      const response = await client
        .index(index.uid)
        .search('"french book" about', {})
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 20)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', '"french book" about')
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with options`, async () => {
    try {
      const response = await client
        .index(index.uid)
        .search('prince', { limit: 1 })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 1)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(1)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with sortable`, async () => {
    try {
      const response = await client
        .index(index.uid)
        .search('', { sort: ['id:asc'] })
      expect(response).toHaveProperty('hits', expect.any(Array))
      const hit = response.hits[0]
      expect(hit.id).toEqual(1)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with array options`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {
        attributesToRetrieve: ['*'],
      })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 20)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with array options`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {
        attributesToRetrieve: ['*'],
      })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 20)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with options`, async () => {
    try {
      const response = await client
        .index(index.uid)
        .search('prince', { limit: 1 })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 1)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(1)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with limit and offset`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {
        limit: 1,
        offset: 1,
      })
      expect(response).toHaveProperty('hits', [
        {
          id: 4,
          title: 'Harry Potter and the Half-Blood Prince',
          comment: 'The best book',
          genre: 'fantasy',
        },
      ])
      expect(response).toHaveProperty('offset', 1)
      expect(response).toHaveProperty('limit', 1)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(1)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with matches parameter and small croplength`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {
        filter: 'title = "Le Petit Prince"',
        attributesToCrop: ['*'],
        cropLength: 5,
        matches: true,
      })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 20)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(1)
      expect(response.hits[0]).toHaveProperty('_matchesInfo', {
        comment: [{ start: 22, length: 6 }],
        title: [{ start: 9, length: 6 }],
      })
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with all options but not all fields`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['*'],
        cropLength: 6,
        attributesToHighlight: ['*'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 5)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits[0]._formatted).toHaveProperty('title')
      expect(response.hits[0]._formatted).toHaveProperty('id')
      expect(response.hits[0]).not.toHaveProperty('comment')
      expect(response.hits[0]).not.toHaveProperty('description')
      expect(response.hits.length).toEqual(1)
      expect(response.hits[0]).toHaveProperty('_formatted', expect.any(Object))
      expect(response.hits[0]._formatted).toHaveProperty(
        'title',
        'Petit <em>Prince</em>'
      )
      expect(response.hits[0]).toHaveProperty(
        '_matchesInfo',
        expect.any(Object)
      )
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with all options and all fields`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['*'],
        attributesToCrop: ['*'],
        cropLength: 6,
        attributesToHighlight: ['*'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 5)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(1)
      expect(response.hits[0]).toHaveProperty('_formatted', expect.any(Object))
      expect(response.hits[0]._formatted).toHaveProperty(
        'title',
        'Petit <em>Prince</em>'
      )
      expect(response.hits[0]).toHaveProperty(
        '_matchesInfo',
        expect.any(Object)
      )
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with all options but specific fields`, async () => {
    try {
      const response = await client.index(index.uid).search('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['id', 'title'],
        cropLength: 6,
        attributesToHighlight: ['id', 'title'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 5)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(1)
      expect(response.hits[0]).toHaveProperty('id', 456)
      expect(response.hits[0]).toHaveProperty('title', 'Le Petit Prince')
      expect(response.hits[0]).not.toHaveProperty('comment')
      expect(response.hits[0]).toHaveProperty('_formatted', expect.any(Object))
      expect(response.hits[0]).not.toHaveProperty(
        'description',
        expect.any(Object)
      )
      expect(response.hits[0]._formatted).toHaveProperty(
        'title',
        'Petit <em>Prince</em>'
      )
      expect(response.hits[0]._formatted).not.toHaveProperty('comment')
      expect(response.hits[0]).toHaveProperty(
        '_matchesInfo',
        expect.any(Object)
      )
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with filter and facetsDistribution`, async () => {
    try {
      const response = await client.index(index.uid).search('a', {
        filter: ['genre = romance'],
        facetsDistribution: ['genre'],
      })
      expect(response).toHaveProperty('facetsDistribution', {
        genre: { romance: 2 },
      })
      expect(response).toHaveProperty('exhaustiveFacetsCount', false)
      expect(response).toHaveProperty('exhaustiveNbHits', false)
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with filter on number`, async () => {
    try {
      const response = await client.index(index.uid).search('a', {
        filter: 'id < 0',
      })
      expect(response).toHaveProperty('exhaustiveNbHits', false)
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response.hits.length).toEqual(0)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with filter with spaces`, async () => {
    try {
      const response = await client.index(index.uid).search('h', {
        filter: ['genre = "sci fi"'],
      })
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response.hits.length).toEqual(1)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with multiple filter`, async () => {
    try {
      const response = await client.index(index.uid).search('a', {
        filter: ['genre = romance', ['genre = romance', 'genre = romance']],
        facetsDistribution: ['genre'],
      })
      expect(response).toHaveProperty('facetsDistribution', {
        genre: { romance: 2 },
      })
      expect(response).toHaveProperty('exhaustiveFacetsCount', false)
      expect(response).toHaveProperty('exhaustiveNbHits', false)
      expect(response).toHaveProperty('hits', expect.any(Array))
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with multiple filter and undefined query (placeholder)`, async () => {
    try {
      const response = await client.index(index.uid).search(undefined, {
        filter: ['genre = fantasy'],
        facetsDistribution: ['genre'],
      })
      expect(response).toHaveProperty('facetsDistribution', {
        genre: { fantasy: 2 },
      })
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with multiple filter and null query (placeholder)`, async () => {
    try {
      const response = await client.index(index.uid).search(null, {
        filter: ['genre = fantasy'],
        facetsDistribution: ['genre'],
      })
      expect(response).toHaveProperty('facetsDistribution', {
        genre: { fantasy: 2 },
      })
      expect(response.hits.length).toEqual(2)
      expect(response.nbHits).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search with multiple filter and empty string query (placeholder)`, async () => {
    try {
      const response = await client.index(index.uid).search('', {
        filter: ['genre = fantasy'],
        facetsDistribution: ['genre'],
      })
      expect(response).toHaveProperty('facetsDistribution', {
        genre: { fantasy: 2 },
      })
      expect(response.hits.length).toEqual(2)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: search on index with no documents and no primary key`, async () => {
    try {
      const response = await client.index(emptyIndex.uid).search('prince', {})
      expect(response).toHaveProperty('hits', [])
      expect(response).toHaveProperty('offset', 0)
      expect(response).toHaveProperty('limit', 20)
      expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
      expect(response).toHaveProperty('query', 'prince')
      expect(response.hits.length).toEqual(0)
    } catch (error) {
      throw new Error(error)
    }
  })

  test(`${permission} key: Try to search on deleted index and fail`, async () => {
    await masterClient.index(index.uid).delete()
    await expect(
      client.index(index.uid).search('prince', {})
    ).rejects.toHaveProperty('errorCode', ErrorStatusCode.INDEX_NOT_FOUND)
  })
})

describe.each([{ client: anonymousClient, permission: 'Client' }])(
  'Test failing test on search',
  ({ client, permission }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: Try Basic search and be denied`, async () => {
      await expect(
        client.index(index.uid).search('prince')
      ).rejects.toHaveProperty(
        'errorCode',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.each([
  { client: masterClient, permission: 'Master' },
  // { client: privateClient, permission: 'Private' },
  // { client: publicClient, permission: 'Public' },
])('Test on abortable search', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
  })

  test(`${permission} key: search on index and abort`, () => {
    const controller = new AbortController()

    const searchPromise = client.index(index.uid).search(
      'unreachable',
      {},
      {
        signal: controller.signal,
      }
    )

    controller.abort()

    searchPromise.catch((error) => {
      expect(error).toHaveProperty('message', 'The user aborted a request.')
    })
  })

  test(`${permission} key: search on index multiple times, and abort only one request`, () => {
    const controllerA = new AbortController()
    const controllerB = new AbortController()
    const controllerC = new AbortController()

    const searchQuery = 'prince'

    const searchAPromise = client.index(index.uid).search(
      searchQuery,
      {},
      {
        signal: controllerA.signal,
      }
    )

    const searchBPromise = client.index(index.uid).search(
      searchQuery,
      {},
      {
        signal: controllerB.signal,
      }
    )

    const searchCPromise = client.index(index.uid).search(
      searchQuery,
      {},
      {
        signal: controllerC.signal,
      }
    )

    const searchDPromise = client.index(index.uid).search(searchQuery, {})

    controllerB.abort()

    searchDPromise.then((response) => {
      expect(response).toHaveProperty('query', searchQuery)
    })

    searchCPromise.then((response) => {
      expect(response).toHaveProperty('query', searchQuery)
    })

    searchAPromise.then((response) => {
      expect(response).toHaveProperty('query', searchQuery)
    })

    searchBPromise.catch((error) => {
      expect(error).toHaveProperty('message', 'The user aborted a request.')
    })
  })
})

describe.each([
  { host: BAD_HOST, trailing: false },
  { host: `${BAD_HOST}/api`, trailing: false },
  { host: `${BAD_HOST}/trailing/`, trailing: true },
])('Tests on url construction', ({ host, trailing }) => {
  test(`Test get search route`, async () => {
    const route = `indexes/${index.uid}/search`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).search()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test post search route`, async () => {
    const route = `indexes/${index.uid}/search`
    const client = new MeiliSearch({ host })
    const strippedHost = trailing ? host.slice(0, -1) : host
    await expect(client.index(index.uid).search()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
