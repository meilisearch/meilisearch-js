import {
  MeiliSearch,
  IndexResponse,
  SearchResponse,
  Hits,
  Hit,
  SearchParams,
} from '../../../../'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

interface Movie {
  id: number
  title: string
  genre?: string
}

const client = new MeiliSearch(config)

;(async () => {
  const index = await client.getOrCreateIndex<Movie>('movies')

  const indexes = await client.getIndexes()
  indexes.map((index: IndexResponse) => {
    console.log(index.uid)
    // console.log(index.something) -> ERROR
  })

  const searchParams: SearchParams = {
    limit: 5,
    attributesToRetrieve: ['title', 'genre'],
    attributesToHighlight: ['title'],
    // test: true -> ERROR Test does not exist on type SearchParams
  }
  indexes.map((index: IndexResponse) => index.uid)
  const res: SearchResponse<Movie> = await index.search('avenger', searchParams)

  // both work
  const { hits }: { hits: Hits<Movie> } = res

  hits.map((hit: Hit<Movie>) => {
    console.log(hit?.genre)
    console.log(hit.title)
    // console.log(hit._formatted.title) -> ERROR, _formatted could be undefined
    // console.log(hit?._formatted.title) -> ERROR, title could be undefined
    console.log(hit?._formatted?.title)
  })

  await index.delete()
})()
