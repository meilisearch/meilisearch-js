import * as Types from '../src/types'
import {
  clearAllIndexes,
  config,
  masterClient,
  privateClient,
  publicClient,
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
])('Test on GET search', ({ client, permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    await masterClient.createIndex(index.uid)
    await masterClient.createIndex(emptyIndex.uid)

    const newFilterableAttributes = ['genre', 'title', 'id']
    const { updateId: settingUpdateId } = await masterClient
      .index(index.uid)
      .updateFilterableAttributes(newFilterableAttributes)
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

  test(`${permission} key: Basic search`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {})
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: search with options`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', { limit: 1 })
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: search with array options`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {
        attributesToRetrieve: ['*'],
      })
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: search with array options`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {
        attributesToRetrieve: ['*'],
      })
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 20)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: search with options`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', { limit: 1 })
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 1)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: search with limit and offset`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {
        limit: 1,
        offset: 1,
      })
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
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
        expect(response).toHaveProperty('query', 'prince')
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: search with matches parameter and small croplength`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {
        filter: 'title = "Le Petit Prince"',
        attributesToCrop: ['*'],
        cropLength: 5,
        matches: true,
      })
      .then((response) => {
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
      })
  })

  test(`${permission} key: search with all options but not all fields`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['*'],
        cropLength: 6,
        attributesToHighlight: ['*'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response) => {
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

  test(`${permission} key: search with all options and all fields`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['*'],
        attributesToCrop: ['*'],
        cropLength: 6,
        attributesToHighlight: ['*'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response) => {
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

  test(`${permission} key: search with all options but specific fields`, async () => {
    await client
      .index(index.uid)
      .searchGet('prince', {
        limit: 5,
        offset: 0,
        attributesToRetrieve: ['id', 'title'],
        attributesToCrop: ['id', 'title'],
        cropLength: 6,
        attributesToHighlight: ['id', 'title'],
        filter: 'title = "Le Petit Prince"',
        matches: true,
      })
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response).toHaveProperty('offset', 0)
        expect(response).toHaveProperty('limit', 5)
        expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
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

  test(`${permission} key: search with filter and facetsDistribution`, async () => {
    await client
      .index(index.uid)
      .searchGet('a', {
        filter: 'genre = romance',
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response).toHaveProperty('facetsDistribution', {
          genre: { romance: 2 },
        })
        expect(response).toHaveProperty('exhaustiveFacetsCount', false)
        expect(response).toHaveProperty('exhaustiveNbHits', false)
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: search with filter on number`, async () => {
    await client
      .index(index.uid)
      .searchGet('a', {
        filter: 'id < 0',
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response).toHaveProperty('exhaustiveNbHits', false)
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response.hits.length).toEqual(0)
      })
  })

  test(`${permission} key: search with filter with spaces`, async () => {
    await client
      .index(index.uid)
      .searchGet('h', {
        filter: 'genre = "sci fi"',
      })
      .then((response) => {
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response.hits.length).toEqual(1)
      })
  })

  test(`${permission} key: search with multiple filter`, async () => {
    await client
      .index(index.uid)
      .searchGet('a', {
        filter: 'genre = romance AND (genre = romance OR genre = romance)',
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response).toHaveProperty('facetsDistribution', {
          genre: { romance: 2 },
        })
        expect(response).toHaveProperty('exhaustiveFacetsCount', false)
        expect(response).toHaveProperty('exhaustiveNbHits', false)
        expect(response).toHaveProperty('hits', expect.any(Array))
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: search with multiple filter and undefined query (placeholder)`, async () => {
    await client
      .index(index.uid)
      .searchGet(undefined, {
        filter: 'genre = fantasy',
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response).toHaveProperty('facetsDistribution', {
          genre: { fantasy: 2 },
        })
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: search with multiple filter and null query (placeholder)`, async () => {
    await client
      .index(index.uid)
      .searchGet(null, {
        filter: 'genre = fantasy',
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response).toHaveProperty('facetsDistribution', {
          genre: { fantasy: 2 },
        })
        expect(response.hits.length).toEqual(2)
        expect(response.nbHits).toEqual(2)
      })
  })

  test(`${permission} key: search with multiple filter and empty string query (placeholder)`, async () => {

    await client
      .index(index.uid)
      .searchGet('', {
        filter: 'genre = fantasy',
        facetsDistribution: ['genre'],
      })
      .then((response) => {
        expect(response).toHaveProperty('facetsDistribution', {
          genre: { fantasy: 2 },
        })
        expect(response.hits.length).toEqual(2)
      })
  })

  test(`${permission} key: Try to search with wrong format filter`, async () => {
    await expect(
      client.index(index.uid).searchGet('prince', {
        filter: ['hello'],
      })
    ).rejects.toHaveProperty(
      'message',
      'The filter query parameter should be in string format when using searchGet'
    )
  })

  test(`${permission} key: Try to search on deleted index and fail`, async () => {
    await masterClient.index(index.uid).delete()
    await expect(
      client.index(index.uid).searchGet('prince')
    ).rejects.toHaveProperty('errorCode', Types.ErrorStatusCode.INDEX_NOT_FOUND)
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
    await expect(client.index(index.uid).searchGet()).rejects.toHaveProperty(
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
    await expect(client.index(index.uid).searchGet()).rejects.toHaveProperty(
      'message',
      `request to ${strippedHost}/${route} failed, reason: connect ECONNREFUSED ${BAD_HOST.replace(
        'http://',
        ''
      )}`
    )
  })
})
