import { MeiliSearch, IndexResponse } from '../../../../'
import DefaultMeiliSearch from '../../../../'

const config = {
  host: 'http://127.0.0.1:7700',
  apiKey: 'masterKey',
}

const client = new MeiliSearch(config)
const defaultClient = new DefaultMeiliSearch(config)

;(async () => {
  const indexes = await client.listIndexes()
  const defaultIndexes = await defaultClient.listIndexes()
  indexes.map((index: IndexResponse) => index.uid)
  defaultIndexes.map((index: IndexResponse) => index.uid)
})()
