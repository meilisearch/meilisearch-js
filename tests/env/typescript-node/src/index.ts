import {
  MeiliSearch,
} from '../../../../src/index.js'
import { generateTenantToken } from '../../../../src/token.js'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

interface Movie {
  id: number
  title: string
  genre?: string
  comment?: string
  isNull?: null
  isTrue?: true
}

const client = new MeiliSearch(config)
const indexUid = "movies"

;(async () => {
  await client.deleteIndex(indexUid).waitTask()
  await client.createIndex(indexUid).waitTask()

  const index = client.index<Movie>(indexUid)
  const indexes = await client.getRawIndexes()
  indexes.results.map((index) => {
    console.log(index.uid)
    // console.log(index.something) -> ERROR
  })

  const searchParams = {
    q: 'avenger',
    limit: 5,
    attributesToRetrieve: ['title', 'genre'],
    attributesToHighlight: ['title'],
    // test: true -> ERROR Test does not exist on type SearchParams
  }
  indexes.results.map((index) => index.uid)
  const res = await index.search(searchParams)

  // both work
  const { hits } = res

  hits.map((hit) => {
    console.log(hit?.genre)
    console.log(hit.title)
    // console.log(hit._formatted.title) -> ERROR, _formatted could be undefined
    // console.log(hit?._formatted.title) -> ERROR, title could be undefined
    console.log(hit?._formatted?.title)
  })

  console.log(await generateTenantToken({ apiKey: config.apiKey, apiKeyUid: 'e489fe16-3381-431b-bee3-00430192915d' }))

  await index.delete()
})()
