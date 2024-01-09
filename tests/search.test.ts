import AbortController from 'abort-controller'
import { ErrorStatusCode, MatchingStrategies } from '../src/types'
import { EnqueuedTask } from '../src/enqueued-task'
import {
  clearAllIndexes,
  config,
  BAD_HOST,
  MeiliSearch,
  getClient,
  datasetWithNests,
  HOST,
  getKey,
} from './utils/meilisearch-test-utils'

if (typeof fetch === 'undefined') {
  require('cross-fetch/polyfill')
}

const index = {
  uid: 'movies_test',
}
const emptyIndex = {
  uid: 'empty_test',
}

type Books = {
  id: number
  title: string
  comment: string
  genre: string
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
    isNull: null,
    isTrue: true,
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

describe.each([
  { permission: 'Master' },
  { permission: 'Admin' },
  { permission: 'Search' },
])('Test on POST search', ({ permission }) => {
  beforeAll(async () => {
    await clearAllIndexes(config)
    const client = await getClient('Master')
    await client.createIndex(index.uid)
    await client.createIndex(emptyIndex.uid)

    const newFilterableAttributes = ['genre', 'title', 'id']
    const { taskUid: task1 }: EnqueuedTask = await client
      .index(index.uid)
      .updateSettings({
        filterableAttributes: newFilterableAttributes,
        sortableAttributes: ['id'],
      })
    await client.waitForTask(task1)

    const { taskUid: task2 } = await client
      .index(index.uid)
      .addDocuments(dataset)
    await client.waitForTask(task2)
  })

  test(`${permission} key: Multi index search no queries`, async () => {
    const client = await getClient(permission)
    const response = await client.multiSearch({
      queries: [],
    })

    expect(response.results.length).toEqual(0)
  })

  test(`${permission} key: Multi index search with one query`, async () => {
    const client = await getClient(permission)
    const response = await client.multiSearch({
      queries: [{ indexUid: index.uid, q: 'prince' }],
    })

    expect(response.results[0].hits.length).toEqual(2)
  })

  test(`${permission} key: Multi index search with multiple queries`, async () => {
    const client = await getClient(permission)
    const response = await client.multiSearch({
      queries: [
        { indexUid: index.uid, q: 'something' },
        { indexUid: emptyIndex.uid, q: 'something' },
      ],
    })

    expect(response.results.length).toEqual(2)
  })

  test(`${permission} key: Multi index search with one query`, async () => {
    const client = await getClient(permission)

    type MyIndex = {
      id: 1
    }

    const response = await client.multiSearch<MyIndex & Books>({
      queries: [{ indexUid: index.uid, q: 'prince' }],
    })

    expect(response.results[0].hits.length).toEqual(2)
    expect(response.results[0].hits[0].id).toEqual(456)
    expect(response.results[0].hits[0].title).toEqual('Le Petit Prince')
  })

  test(`${permission} key: Basic search`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {})

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.facetStats).toBeUndefined()
    expect(response.hits.length).toEqual(2)
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.hitsPerPage).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.page).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.totalPages).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.totalHits).toBeUndefined()
  })

  test(`${permission} key: Basic phrase search with matchingStrategy at ALL`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('"french book" about', {
        matchingStrategy: MatchingStrategies.ALL,
      })

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 20)
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: Basic phrase search with matchingStrategy at LAST`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('french book', { matchingStrategy: MatchingStrategies.LAST })

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 20)
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: Search with query in searchParams overwriting query`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('other', { q: 'prince' })

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('offset', 0)
    expect(response.estimatedTotalHits).toBeDefined()
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: Search with query in searchParams overwriting null query`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search(null, { q: 'prince' })

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('offset', 0)
    expect(response.estimatedTotalHits).toBeDefined()
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: Basic phrase search`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('"french book" about', {})
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('limit', 20)
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', '"french book" about')

    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('prince', { limit: 1 })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 1)
    expect(response.estimatedTotalHits).toEqual(2)
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

  test(`${permission} key: search with _showRankingScore enabled`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('prince', {
      showRankingScore: true,
    })

    const hit = response.hits[0]

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('query', 'prince')
    expect(hit).toHaveProperty('_rankingScore')
  })

  test(`${permission} key: search with showRankingScoreDetails enabled`, async () => {
    const client = await getClient(permission)
    const key = await getKey(permission)

    await fetch(`${HOST}/experimental-features`, {
      body: JSON.stringify({ scoreDetails: true }),
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })

    const response = await client.index(index.uid).search('prince', {
      showRankingScoreDetails: true,
    })

    const hit = response.hits[0]

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('query', 'prince')
    expect(hit).toHaveProperty('_rankingScoreDetails')
    expect(Object.keys(hit._rankingScoreDetails || {})).toEqual([
      'words',
      'typo',
      'proximity',
      'attribute',
      'exactness',
    ])
  })

  test(`${permission} key: search with array options`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('prince', {
      attributesToRetrieve: ['*'],
    })
    const hit = response.hits[0]

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('query', 'prince')
    expect(Object.keys(hit).join(',')).toEqual(
      Object.keys(dataset[1]).join(',')
    )
  })

  test(`${permission} key: search on attributesToSearchOn`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('prince', {
      attributesToSearchOn: ['id'],
    })

    expect(response.hits.length).toEqual(0)
  })

  test(`${permission} key: search on attributesToSearchOn set to null`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('prince', {
      attributesToSearchOn: null,
    })

    expect(response).toMatchSnapshot()
  })

  test(`${permission} key: search with array options`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('prince', {
      attributesToRetrieve: ['*'],
    })
    const hit = response.hits[0]

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('query', 'prince')
    expect(Object.keys(hit).join(',')).toEqual(
      Object.keys(dataset[1]).join(',')
    )
  })

  test(`${permission} key: search with options`, async () => {
    const client = await getClient(permission)
    const response = await client
      .index(index.uid)
      .search('prince', { limit: 1 })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 1)
    expect(response.estimatedTotalHits).toEqual(2)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with limit and offset`, async () => {
    const client = await getClient(permission)

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
    expect(response.estimatedTotalHits).toEqual(2)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.hitsPerPage).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.page).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.totalPages).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because neither `page` or `hitsPerPage` is provided in the search params.
    expect(response.totalHits).toBeUndefined()
  })

  test(`${permission} key: search with matches parameter and small croplength`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      filter: 'title = "Le Petit Prince"',
      attributesToCrop: ['*'],
      cropLength: 5,
      showMatchesPosition: true,
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits[0]).toHaveProperty('_matchesPosition', {
      comment: [{ start: 22, length: 6 }],
      title: [{ start: 9, length: 6 }],
    })
  })

  test(`${permission} key: search with all options but not all fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ['id', 'title'],
      attributesToCrop: ['*'],
      cropLength: 6,
      attributesToHighlight: ['*'],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 5)
    expect(response.estimatedTotalHits).toEqual(1)
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
      'Le Petit <em>Prince</em>'
    )
    expect(response.hits[0]).toHaveProperty(
      '_matchesPosition',
      expect.any(Object)
    )
  })

  test(`${permission} key: search on default cropping parameters`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      attributesToCrop: ['*'],
      cropLength: 6,
    })

    expect(response.hits[0]._formatted).toHaveProperty(
      'comment',
      '…book about a prince that walks…'
    )
  })

  test(`${permission} key: search on customized cropMarker`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      attributesToCrop: ['*'],
      cropLength: 6,
      cropMarker: '(ꈍᴗꈍ)',
    })

    expect(response.hits[0]._formatted).toHaveProperty(
      'comment',
      '(ꈍᴗꈍ)book about a prince that walks(ꈍᴗꈍ)'
    )
  })

  test(`${permission} key: search on customized highlight tags`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      attributesToHighlight: ['*'],
      highlightPreTag: '(⊃｡•́‿•̀｡)⊃ ',
      highlightPostTag: ' ⊂(´• ω •`⊂)',
    })

    expect(response.hits[0]._formatted).toHaveProperty(
      'comment',
      'A french book about a (⊃｡•́‿•̀｡)⊃ prince ⊂(´• ω •`⊂) that walks on little cute planets'
    )
  })

  test(`${permission} key: search with all options and all fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ['*'],
      attributesToCrop: ['*'],
      cropLength: 6,
      attributesToHighlight: ['*'],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
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
      'Le Petit <em>Prince</em>'
    )
    expect(response.hits[0]).toHaveProperty(
      '_matchesPosition',
      expect.any(Object)
    )
  })

  test(`${permission} key: search with all options but specific fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      limit: 5,
      offset: 0,
      attributesToRetrieve: ['id', 'title'],
      attributesToCrop: ['id', 'title'],
      cropLength: 6,
      attributesToHighlight: ['id', 'title'],
      filter: 'title = "Le Petit Prince"',
      showMatchesPosition: true,
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response).toHaveProperty('offset', 0)
    expect(response).toHaveProperty('limit', 5)
    expect(response).toHaveProperty('processingTimeMs', expect.any(Number))
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(1)
    expect(response.hits[0]._formatted?.id).toEqual('456')
    expect(response.hits[0]).toHaveProperty('title', 'Le Petit Prince')
    expect(response.hits[0]).not.toHaveProperty('comment')
    expect(response.hits[0]).toHaveProperty('_formatted', expect.any(Object))
    expect(response.hits[0]).not.toHaveProperty(
      'description',
      expect.any(Object)
    )
    expect(response.hits[0]._formatted).toHaveProperty(
      'title',
      'Le Petit <em>Prince</em>'
    )
    expect(response.hits[0]._formatted).not.toHaveProperty('comment')
    expect(response.hits[0]).toHaveProperty(
      '_matchesPosition',
      expect.any(Object)
    )
  })

  test(`${permission} key: Search with specific fields in attributesToHighlight and check for types of number fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      attributesToHighlight: ['title'],
    })
    expect(response.hits[0]._formatted?.id).toEqual('456')
    expect(response.hits[0]._formatted?.isNull).toEqual(null)
    expect(response.hits[0]._formatted?.isTrue).toEqual(true)
  })

  test(`${permission} key: Search with specific fields in attributesToHighlight and check for types of number fields`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('prince', {
      attributesToHighlight: ['title', 'id'],
    })
    expect(response.hits[0]._formatted?.id).toEqual('456')
    expect(response.hits[0]._formatted?.isNull).toEqual(null)
    expect(response.hits[0]._formatted?.isTrue).toEqual(true)
  })

  test(`${permission} key: search with filter and facetDistribution`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('a', {
      filter: ['genre = romance'],
      facets: ['genre', 'id'],
    })

    expect(response).toHaveProperty('facetDistribution', {
      genre: { romance: 2 },
      id: { '123': 1, '2': 1 },
    })

    expect(response.facetStats).toEqual({ id: { min: 2, max: 123 } })
    expect(response.facetStats?.['id']?.max).toBe(123)
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with filter on number`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('a', {
      filter: 'id < 0',
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(0)
  })

  test(`${permission} key: search with filter with spaces`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('h', {
      filter: ['genre = "sci fi"'],
    })

    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(1)
  })

  test(`${permission} key: search with multiple filter`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('a', {
      filter: ['genre = romance', ['genre = romance', 'genre = romance']],
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { romance: 2 },
    })
    expect(response).toHaveProperty('hits', expect.any(Array))
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and undefined query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search(undefined, {
      filter: ['genre = fantasy'],
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and null query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search(null, {
      filter: ['genre = fantasy'],
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with multiple filter and empty string query (placeholder)`, async () => {
    const client = await getClient(permission)
    const response = await client.index(index.uid).search('', {
      filter: ['genre = fantasy'],
      facets: ['genre'],
    })
    expect(response).toHaveProperty('facetDistribution', {
      genre: { fantasy: 2 },
    })
    expect(response.hits.length).toEqual(2)
  })

  test(`${permission} key: search with pagination parameters: hitsPerPage and page`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 1,
      page: 1,
    })

    expect(response.hits.length).toEqual(1)
    expect(response.totalPages).toEqual(7)
    expect(response.hitsPerPage).toEqual(1)
    expect(response.page).toEqual(1)
    expect(response.totalHits).toEqual(7)
  })

  test(`${permission} key: search with pagination parameters: hitsPerPage at 0 and page at 1`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 0,
      page: 1,
    })

    expect(response.hits.length).toEqual(0)
    expect(response.hitsPerPage).toEqual(0)
    expect(response.page).toEqual(1)
    expect(response.totalPages).toEqual(0)
    expect(response.totalHits).toEqual(7)
  })

  test(`${permission} key: search with pagination parameters: hitsPerPage at 0`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 0,
    })

    expect(response.hits.length).toEqual(0)
    expect(response.hitsPerPage).toEqual(0)
    expect(response.page).toEqual(1)
    expect(response.totalPages).toEqual(0)
    expect(response.totalHits).toEqual(7)
    // @ts-expect-error Not present in the SearchResponse type because `page` and/or `hitsPerPage` is provided in the search params.
    expect(response.limit).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because `page` and/or `hitsPerPage` is provided in the search params.
    expect(response.offset).toBeUndefined()
    // @ts-expect-error Not present in the SearchResponse type because `page` and/or `hitsPerPage` is provided in the search params.
    expect(response.estimatedTotalHits).toBeUndefined()
  })

  test(`${permission} key: search with pagination parameters: hitsPerPage at 1 and page at 0`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 1,
      page: 0,
    })

    expect(response.hits.length).toEqual(0)
    expect(response.hitsPerPage).toEqual(1)
    expect(response.page).toEqual(0)
    expect(response.totalPages).toEqual(7)
    expect(response.totalHits).toEqual(7)
  })

  test(`${permission} key: search with pagination parameters: page at 0`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      page: 0,
    })

    expect(response.hits.length).toEqual(0)
    expect(response.hitsPerPage).toEqual(20)
    expect(response.page).toEqual(0)
    expect(response.totalPages).toEqual(1)
    expect(response.totalHits).toEqual(7)
  })

  test(`${permission} key: search with pagination parameters: hitsPerPage at 0 and page at 0`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 0,
      page: 0,
    })

    expect(response.hits.length).toEqual(0)

    // @ts-expect-error Property not existing on type
    expect(response.limit).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.offset).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.estimatedTotalHits).toBeUndefined()

    expect(response.hitsPerPage).toEqual(0)
    expect(response.page).toEqual(0)
    expect(response.totalPages).toEqual(0)
    expect(response.totalHits).toEqual(7)
  })

  test(`${permission} key: search with pagination parameters hitsPerPage/page and offset/limit`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 1,
      page: 1,
      offset: 1,
      limit: 1,
    })

    expect(response.hits.length).toEqual(1)
    // @ts-expect-error Property not existing on type
    expect(response.limit).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.offset).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.estimatedTotalHits).toBeUndefined()
    expect(response.hitsPerPage).toEqual(1)
    expect(response.page).toEqual(1)
    expect(response.totalPages).toEqual(7)
    expect(response.totalHits).toEqual(7)
  })

  test(`${permission} key: search with pagination parameters hitsPerPage/page and offset`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 1,
      page: 1,
      offset: 1,
    })

    expect(response.hits.length).toEqual(1)
    // @ts-expect-error Property not existing on type
    expect(response.limit).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.offset).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.estimatedTotalHits).toBeUndefined()
    expect(response.hitsPerPage).toEqual(1)
    expect(response.page).toEqual(1)
    expect(response.totalHits).toEqual(7)
    expect(response.totalPages).toEqual(7)
  })

  test(`${permission} key: search with pagination parameters hitsPerPage/page and limit`, async () => {
    const client = await getClient(permission)

    const response = await client.index(index.uid).search('', {
      hitsPerPage: 1,
      page: 1,
      limit: 1,
    })

    expect(response.hits.length).toEqual(1)
    // @ts-expect-error Property not existing on type
    expect(response.limit).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.offset).toBeUndefined()
    // @ts-expect-error Property not existing on type
    expect(response.estimatedTotalHits).toBeUndefined()
    expect(response.page).toEqual(1)
    expect(response.hitsPerPage).toEqual(1)
    expect(response.totalPages).toEqual(7)
    expect(response.totalHits).toEqual(7)
  })

  test(`${permission} key: search on index with no documents and no primary key`, async () => {
    const client = await getClient(permission)
    const response = await client.index(emptyIndex.uid).search('prince', {})

    expect(response).toHaveProperty('hits', [])
    expect(response).toHaveProperty('query', 'prince')
    expect(response.hits.length).toEqual(0)
  })

  test(`${permission} key: search with vectors`, async () => {
    const client = await getClient(permission)
    const adminClient = await getClient('Admin')
    const adminKey = await getKey('Admin')

    await fetch(`${HOST}/experimental-features`, {
      body: JSON.stringify({ vectorStore: true }),
      headers: {
        Authorization: `Bearer ${adminKey}`,
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })

    const { taskUid } = await adminClient
      .index(emptyIndex.uid)
      .updateEmbedders({
        default: {
          source: 'userProvided',
          dimensions: 1,
        },
      })
    await adminClient.waitForTask(taskUid)

    const response = await client.index(emptyIndex.uid).search('', {
      vector: [1],
      hybrid: {
        semanticRatio: 1.0,
      },
    })

    expect(response.vector).toEqual([1])
  })

  test(`${permission} key: Try to search on deleted index and fail`, async () => {
    const client = await getClient(permission)
    const masterClient = await getClient('Master')
    const { taskUid } = await masterClient.index(index.uid).delete()
    await masterClient.waitForTask(taskUid)

    await expect(
      client.index(index.uid).search('prince', {})
    ).rejects.toHaveProperty('code', ErrorStatusCode.INDEX_NOT_FOUND)
  })
})

describe.each([{ permission: 'No' }])(
  'Test failing test on search',
  ({ permission }) => {
    beforeAll(async () => {
      const client = await getClient('Master')
      const { taskUid } = await client.createIndex(index.uid)
      await client.waitForTask(taskUid)
    })

    test(`${permission} key: Try Basic search and be denied`, async () => {
      const client = await getClient(permission)
      await expect(
        client.index(index.uid).search('prince')
      ).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })

    test(`${permission} key: Try multi search and be denied`, async () => {
      const client = await getClient(permission)
      await expect(client.multiSearch({ queries: [] })).rejects.toHaveProperty(
        'code',
        ErrorStatusCode.MISSING_AUTHORIZATION_HEADER
      )
    })
  }
)

describe.each([{ permission: 'Master' }])(
  'Tests on documents with nested objects',
  ({ permission }) => {
    beforeEach(async () => {
      await clearAllIndexes(config)
      const client = await getClient('Master')
      await client.createIndex(index.uid)

      const { taskUid: documentAdditionTask } = await client
        .index(index.uid)
        .addDocuments(datasetWithNests)
      await client.waitForTask(documentAdditionTask)
    })

    test(`${permission} key: search on nested content with no parameters`, async () => {
      const client = await getClient(permission)
      const response = await client.index(index.uid).search('An awesome', {})

      expect(response.hits[0]).toEqual({
        id: 5,
        title: 'The Hobbit',
        info: {
          comment: 'An awesome book',
          reviewNb: 900,
        },
      })
    })

    test(`${permission} key: search on nested content with searchable on specific nested field`, async () => {
      const client = await getClient(permission)
      const { taskUid: settingsUpdateTask }: EnqueuedTask = await client
        .index(index.uid)
        .updateSettings({
          searchableAttributes: ['title', 'info.comment'],
        })
      await client.waitForTask(settingsUpdateTask)

      const response = await client.index(index.uid).search('An awesome', {})

      expect(response.hits[0]).toEqual({
        id: 5,
        title: 'The Hobbit',
        info: {
          comment: 'An awesome book',
          reviewNb: 900,
        },
      })
    })

    test(`${permission} key: search on nested content with sort`, async () => {
      const client = await getClient(permission)
      const { taskUid: settingsUpdateTask }: EnqueuedTask = await client
        .index(index.uid)
        .updateSettings({
          searchableAttributes: ['title', 'info.comment'],
          sortableAttributes: ['info.reviewNb'],
        })
      await client.waitForTask(settingsUpdateTask)

      const response = await client.index(index.uid).search('', {
        sort: ['info.reviewNb:desc'],
      })

      expect(response.hits[0]).toEqual({
        id: 6,
        title: 'Harry Potter and the Half-Blood Prince',
        info: {
          comment: 'The best book',
          reviewNb: 1000,
        },
      })
    })
  }
)

describe.each([
  { permission: 'Master' },
  { permission: 'Admin' },
  { permission: 'Search' },
])('Test on abortable search', ({ permission }) => {
  beforeAll(async () => {
    const client = await getClient('Master')
    await clearAllIndexes(config)
    const { taskUid } = await client.createIndex(index.uid)
    await client.waitForTask(taskUid)
  })

  test(`${permission} key: search on index and abort`, async () => {
    const controller = new AbortController()
    const client = await getClient(permission)
    const searchPromise = client.index(index.uid).search(
      'unreachable',
      {},
      {
        // @ts-ignore qwe
        signal: controller.signal,
      }
    )

    controller.abort()

    searchPromise.catch((error: any) => {
      expect(error).toHaveProperty('message', 'The user aborted a request.')
    })
  })

  test(`${permission} key: search on index multiple times, and abort only one request`, async () => {
    const client = await getClient(permission)
    const controllerA = new AbortController()
    const controllerB = new AbortController()
    const controllerC = new AbortController()
    const searchQuery = 'prince'

    const searchAPromise = client.index(index.uid).search(
      searchQuery,
      {},
      {
        // @ts-ignore
        signal: controllerA.signal,
      }
    )

    const searchBPromise = client.index(index.uid).search(
      searchQuery,
      {},
      {
        // @ts-ignore
        signal: controllerB.signal,
      }
    )

    const searchCPromise = client.index(index.uid).search(
      searchQuery,
      {},
      {
        // @ts-ignore
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

    searchBPromise.catch((error: any) => {
      expect(error).toHaveProperty('message', 'The user aborted a request.')
    })
  })

  test(`${permission} key: search should be aborted when reaching timeout`, async () => {
    const key = await getKey(permission)
    const client = new MeiliSearch({
      ...config,
      apiKey: key,
      timeout: 1,
    })
    try {
      await client.health()
    } catch (e: any) {
      expect(e.message).toEqual('Error: Request Timed Out')
      expect(e.name).toEqual('MeiliSearchCommunicationError')
    }
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

jest.setTimeout(100 * 1000)

afterAll(() => {
  return clearAllIndexes(config)
})
