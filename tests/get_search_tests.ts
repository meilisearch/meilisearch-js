import { ErrorStatusCode, EnqueuedTask } from '../src/types'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
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
  { permission: 'Master' },
  { permission: 'Private' },
  { permission: 'Public' },
])('Test on GET search', ({ permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    const client = await getClient('Master')
    const { uid: task1 } = await client.createIndex(index.uid)
    await client.waitForTask(task1)
    const { uid: task2 } = await client.createIndex(emptyIndex.uid)
    await client.waitForTask(task2)

    const newFilterableAttributes = ['genre', 'title', 'id']
    const { uid: task3 }: EnqueuedTask = await client
      .index(index.uid)
      .updateSettings({
        filterableAttributes: newFilterableAttributes,
        sortableAttributes: ['id'],
      })
    await client.waitForTask(task3)

    const { uid: task4 } = await client.index(index.uid).addDocuments(dataset)
    await client.waitForTask(task4)
  })

  test(`${permission} key: Basic search`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {})
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .searchGet('prince', { limit: 1 })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 1)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with sortable`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('', { sort: ['id:asc'] })
    expect(response).toHaveProperty('hits', expect.any(Array))
    const hit = response.hits[0]
    expect(hit.id).toEqual(1)
  })

  test(`${permission} key: search with array options`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      attributesToRetrieve: ['*'],
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with array options`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
      attributesToRetrieve: ['*'],
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .searchGet('prince', { limit: 1 })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 1)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with limit and offset`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
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
  })

  test(`${permission} key: search with matches parameter and small croplength`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
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
  })

  test(`${permission} key: search with all options but not all fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
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
    expect(response.hits[0]).toHaveProperty('_matchesInfo', expect.any(Object))
  })

  test(`${permission} key: search with all options and all fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
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
    expect(response.hits[0]).toHaveProperty('_matchesInfo', expect.any(Object))
  })

  test(`${permission} key: search with all options but specific fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('prince', {
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
    expect(response.hits[0]).toHaveProperty('_matchesInfo', expect.any(Object))
  })

  test(`${permission} key: search with filter and facetsDistribution`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('a', {
      filter: 'genre = romance',
      facetsDistribution: ['genre'],
    })
    expect(response).toHaveProperty('facetsDistribution', {
      genre: { romance: 2 },
    })
    expect(response).toHaveProperty('exhaustiveFacetsCount', false)
    expect(response).toHaveProperty('exhaustiveNbHits', false)
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with filter on number`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('a', {
      filter: 'id < 0',
      facetsDistribution: ['genre'],
    })
    expect(response).toHaveProperty('exhaustiveNbHits', false)
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(0)
  })

  test(`${permission} key: search with filter with spaces`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('h', {
      filter: 'genre = "sci fi"',
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with multiple filter`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('a', {
      filter: 'genre = romance AND (genre = romance OR genre = romance)',
      facetsDistribution: ['genre'],
    })
    expect(response).toHaveProperty('facetsDistribution', {
      genre: { romance: 2 },
    })
    expect(response).toHaveProperty('exhaustiveFacetsCount', false)
    expect(response).toHaveProperty('exhaustiveNbHits', false)
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and undefined query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet(undefined, {
      filter: 'genre = fantasy',
      facetsDistribution: ['genre'],
    })
    expect(response).toHaveProperty('facetsDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and null query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet(null, {
      filter: 'genre = fantasy',
      facetsDistribution: ['genre'],
    })
    expect(response).toHaveProperty('facetsDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
    expect(response.nbHits).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and empty string query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).searchGet('', {
      filter: 'genre = fantasy',
      facetsDistribution: ['genre'],
    })
    expect(response).toHaveProperty('facetsDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: Try to search with wrong format filter`, async () => {
    const client = await getClient(permission)
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
    const client = await getClient(permission)
    const masterClient = await getClient('Master')
    const { uid } = await masterClient.index(index.uid).delete()
    await masterClient.waitForTask(uid)
    await expect(
      client.index(index.uid).searchGet('prince')
    ).rejects.toHaveProperty('code', ErrorStatusCode.INDEX_NOT_FOUND)
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
