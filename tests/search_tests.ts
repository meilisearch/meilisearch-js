import AbortController from 'abort-controller'

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
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
  { client: publicClient, permission: 'Public' },
])('Test on search', ({ client, permission }) => {
  describe.each([
    { method: 'POST' as Types.Methods, permission, client },
    { method: 'GET' as Types.Methods, permission, client },
  ])('Test on search', ({ client, permission, method }) => {
    beforeAll(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
      await masterClient.createIndex(emptyIndex.uid)

      const newAttributesForFaceting = ['genre']
      const { updateId: settingUpdateId } = await masterClient
        .index(index.uid)
        .updateAttributesForFaceting(newAttributesForFaceting)
        .then((response: Types.EnqueuedUpdate) => {
          expect(response).toHaveProperty('updateId', expect.any(Number))
          return response
        })
      await masterClient.index(index.uid).waitForPendingUpdate(settingUpdateId)
      const { updateId } = await masterClient
        .index(index.uid)
        .addDocuments(dataset)
      await masterClient.index(index.uid).waitForPendingUpdate(updateId)
    })

    test(`${permission} key: Basic ${method} search`, async () => {
      await client
        .index(index.uid)
        .search('prince', {}, method)
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 20)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits.length).toEqual(2)
        })
    })

    test(`${permission} key: ${method} search with options`, async () => {
      await client
        .index(index.uid)
        .search('prince', { limit: 1 }, method)
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 1)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits.length).toEqual(1)
        })
    })

    test(`${permission} key: ${method} search with options`, async () => {
      await client
        .index(index.uid)
        .search('prince', { limit: 1 }, method)
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 1)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits.length).toEqual(1)
        })
    })

    test(`${permission} key: ${method} search with limit and offset`, async () => {
      await client
        .index(index.uid)
        .search(
          'prince',
          {
            limit: 1,
            offset: 1,
          },
          method
        )
        .then((response) => {
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
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits.length).toEqual(1)
        })
    })

    test(`${permission} key: ${method} search with matches parameter and small croplength`, async () => {
      await client
        .index(index.uid)
        .search(
          'prince',
          {
            filters: 'title = "Le Petit Prince"',
            attributesToCrop: ['*'],
            cropLength: 5,
            matches: true,
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 20)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits.length).toEqual(1)
          expect(response.hits[0]).toHaveProperty('_matchesInfo', {
            comment: [{ start: 2, length: 6 }],
            title: [{ start: 0, length: 6 }],
          })
        })
    })

    test(`${permission} key: ${method} search with all options but not all fields`, async () => {
      await client
        .index(index.uid)
        .search(
          'prince',
          {
            limit: 5,
            offset: 0,
            attributesToRetrieve: ['id', 'title'],
            attributesToCrop: ['*'],
            cropLength: 6,
            attributesToHighlight: ['*'],
            filters: 'title = "Le Petit Prince"',
            matches: true,
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 5)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits[0]._formatted).toHaveProperty('title')
          expect(response.hits[0]._formatted).toHaveProperty('id')
          expect(response.hits[0]).not.toHaveProperty('comment')
          expect(response.hits[0]).not.toHaveProperty('description')
          expect(response.hits[0]._formatted).not.toHaveProperty('comment')
          expect(response.hits[0]._formatted).not.toHaveProperty('description')
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

    test(`${permission} key: ${method} search with all options and all fields`, async () => {
      await client
        .index(index.uid)
        .search(
          'prince',
          {
            limit: 5,
            offset: 0,
            attributesToRetrieve: ['*'],
            attributesToCrop: ['*'],
            cropLength: 6,
            attributesToHighlight: ['*'],
            filters: 'title = "Le Petit Prince"',
            matches: true,
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 5)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
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

    test(`${permission} key: ${method} search with all options but specific fields`, async () => {
      await client
        .index(index.uid)
        .search(
          'prince',
          {
            limit: 5,
            offset: 0,
            attributesToRetrieve: ['id', 'title'],
            attributesToCrop: ['id', 'title'],
            cropLength: 6,
            attributesToHighlight: ['id', 'title'],
            filters: 'title = "Le Petit Prince"',
            matches: true,
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 5)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits.length).toEqual(1)
          expect(response.hits[0]).toHaveProperty('id', 456)
          expect(response.hits[0]).toHaveProperty('title', 'Le Petit Prince')
          expect(response.hits[0]).not.toHaveProperty('comment')
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
          expect(response.hits[0]._formatted).not.toHaveProperty('comment')
          expect(response.hits[0]).toHaveProperty(
            '_matchesInfo',
            expect.any(Object)
          )
        })
    })

    test(`${permission} key: ${method} search with facetFilters and facetsDistribution`, async () => {
      await client
        .index(index.uid)
        .search(
          'a',
          {
            facetFilters: ['genre:romance'],
            facetsDistribution: ['genre'],
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('facetsDistribution', {
            genre: { adventure: 0, fantasy: 0, romance: 2, 'sci fi': 0 },
          })
          expect(response).toHaveProperty('exhaustiveFacetsCount', true)
          expect(response).toHaveProperty('exhaustiveNbHits', false)
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response.hits.length).toEqual(2)
        })
    })

    test(`${permission} key: ${method} search with facetFilters with spaces`, async () => {
      await client
        .index(index.uid)
        .search(
          'h',
          {
            facetFilters: ['genre:sci fi'],
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response.hits.length).toEqual(1)
        })
    })

    test(`${permission} key: ${method} search with multiple facetFilters`, async () => {
      await client
        .index(index.uid)
        .search(
          'a',
          {
            facetFilters: ['genre:romance', ['genre:romance', 'genre:romance']],
            facetsDistribution: ['genre'],
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('facetsDistribution', {
            genre: { adventure: 0, fantasy: 0, romance: 2, 'sci fi': 0 },
          })
          expect(response).toHaveProperty('exhaustiveFacetsCount', true)
          expect(response).toHaveProperty('exhaustiveNbHits', false)
          expect(response).toHaveProperty('hits', expect.any(Array))
          expect(response.hits.length).toEqual(2)
        })
    })

    test(`${permission} key: ${method} search with multiple facetFilters and undefined query (placeholder)`, async () => {
      await client
        .index(index.uid)
        .search(
          undefined,
          {
            facetFilters: ['genre:fantasy'],
            facetsDistribution: ['genre'],
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('facetsDistribution', {
            genre: { adventure: 0, fantasy: 2, romance: 0, 'sci fi': 0 },
          })
          expect(response.hits.length).toEqual(2)
        })
    })

    test(`${permission} key: ${method} search with multiple facetFilters and null query (placeholder)`, async () => {
      await client
        .index(index.uid)
        .search(
          null,
          {
            facetFilters: ['genre:fantasy'],
            facetsDistribution: ['genre'],
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('facetsDistribution', {
            genre: { adventure: 0, fantasy: 2, romance: 0, 'sci fi': 0 },
          })
          expect(response.hits.length).toEqual(2)
          expect(response.nbHits).toEqual(2)
        })
    })

    test(`${permission} key: ${method} search with multiple facetFilters and empty string query (placeholder)`, async () => {
      await client
        .index(index.uid)
        .search(
          '',
          {
            facetFilters: ['genre:fantasy'],
            facetsDistribution: ['genre'],
          },
          method
        )
        .then((response) => {
          expect(response).toHaveProperty('facetsDistribution', {
            genre: { adventure: 0, fantasy: 2, romance: 0, 'sci fi': 0 },
          })
          expect(response.hits.length).toEqual(2)
        })
    })

    test(`${permission} key: ${method} search on index with no documents and no primary key`, async () => {
      await client
        .index(emptyIndex.uid)
        .search('prince', {}, method)
        .then((response) => {
          expect(response).toHaveProperty('hits', [])
          expect(response).toHaveProperty('offset', 0)
          expect(response).toHaveProperty('limit', 20)
          expect(response).toHaveProperty(
            'processingTimeMs',
            expect.any(Number)
          )
          expect(response).toHaveProperty('query', 'prince')
          expect(response.hits.length).toEqual(0)
        })
    })

    test(`${permission} key: Try to ${method} search on deleted index and fail`, async () => {
      await masterClient.index(index.uid).delete()
      await expect(
        client.index(index.uid).search('prince', {}, method)
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.INDEX_NOT_FOUND
      )
    })
  })
})

describe.each([{ client: anonymousClient, permission: 'Client' }])(
  'Test failing test on search',
  ({ client, permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: Try Basic search and be denied`, async () => {
      await expect(
        client.index(index.uid).search('prince')
      ).rejects.toHaveProperty(
        'errorCode',
        Types.ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.each([
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
  { client: publicClient, permission: 'Public' },
  { client: masterClient, permission: 'Master' },
  { client: privateClient, permission: 'Private' },
  { client: publicClient, permission: 'Public' },
])('Test on abortable search', ({ client, permission }) => {
  describe.each([
    { method: 'POST' as Types.Methods, permission, client },
    { method: 'GET' as Types.Methods, permission, client },
  ])('Test on abortable search', ({ client, permission, method }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      await masterClient.createIndex(index.uid)
    })

    test(`${permission} key: ${method} search on index and abort`, () => {
      const controller = new AbortController()

      const searchPromise = client
        .index(index.uid)
        .search('unreachable', {}, method, {
          signal: controller.signal,
        })

      controller.abort()

      searchPromise.catch((error) => {
        expect(error).toHaveProperty('message', 'The user aborted a request.')
      })
    })

    test(`${permission} key: ${method} search on index multiple times, and abort only one request`, () => {
      const controllerA = new AbortController()
      const controllerB = new AbortController()
      const controllerC = new AbortController()

      const searchQuery = 'prince'

      const searchAPromise = client
        .index(index.uid)
        .search(searchQuery, {}, method, {
          signal: controllerA.signal,
        })

      const searchBPromise = client
        .index(index.uid)
        .search(searchQuery, {}, method, {
          signal: controllerB.signal,
        })

      const searchCPromise = client
        .index(index.uid)
        .search(searchQuery, {}, method, {
          signal: controllerC.signal,
        })

      const searchDPromise = client
        .index(index.uid)
        .search(searchQuery, {}, method)

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
})

describe('Tests on url construction', () => {
  test(`Test get search route`, async () => {
    const route = `indexes/${index.uid}/search`
    await expect(
      badHostClient.index(index.uid).search()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })

  test(`Test post search route`, async () => {
    const route = `indexes/${index.uid}/search`
    await expect(
      badHostClient.index(index.uid).search()
    ).rejects.toHaveProperty(
      'message',
      `request to ${BAD_HOST}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
